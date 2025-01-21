import gpustat
import psutil
import time
import json
import requests
import socket
import subprocess
from datetime import datetime
import asyncio  # 添加异步支持

# 添加全局变量用于缓存
docker_memory_cache = {}
last_docker_update_time = 0
docker_update_interval = 30  # 每30秒更新一次

def get_process_info(pid):
    """获取进程的详细信息"""
    try:
        process = psutil.Process(pid)
        return {
            'pid': pid,
            'name': process.name(),
            'cmdline': ' '.join(process.cmdline()),
            'cpu_percent': process.cpu_percent(),
            'memory_percent': process.memory_percent(),
            'create_time': process.create_time(),
            'status': process.status(),
            'username': process.username()
        }
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return None

def get_all_processes():
    """获取所有进程信息"""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            # 获取基本信息
            proc_info = proc.info
            # 获取详细信息
            detailed_info = get_process_info(proc_info['pid'])
            if detailed_info:
                # 检查是否是GPU进程
                is_gpu_process = False
                gpu_memory = 0
                gpu_id = None
                
                # 将进程信息添加到列表
                processes.append({
                    **detailed_info,
                    'is_gpu_process': is_gpu_process,
                    'gpu_memory_usage': gpu_memory,
                    'gpu_id': gpu_id
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return processes

def get_ip_address():
    """获取主机的实际IP地址"""
    try:
        # 创建一个UDP套接字
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 连接一个外部地址（不需要真实连接）
        s.connect(('8.8.8.8', 80))
        # 获取本地地址
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        # 如果上述方法失败，尝试其他方法
        try:
            # 获取所有网络接口
            interfaces = psutil.net_if_addrs()
            for interface_name, interface_addresses in interfaces.items():
                # 跳过回环接口
                if interface_name.startswith('lo'):
                    continue
                # 查找IPv4地址
                for addr in interface_addresses:
                    if addr.family == socket.AF_INET:  # IPv4
                        if not addr.address.startswith('127.'):  # 排除本地回环地址
                            return addr.address
        except Exception:
            pass
        return '未知'

def get_screen_sessions():
    """获取screen会话列表"""
    try:
        # 执行screen -ls命令
        result = subprocess.run(['screen', '-ls'], capture_output=True, text=True)
        output = result.stdout
        
        # 解析输出
        sessions = []
        for line in output.split('\n'):
            # screen -ls 输出格式类似：
            # "12345.name (Detached)" 或 "12345.name (Attached)"
            if '.' in line and ('Detached' in line or 'Attached' in line):
                parts = line.strip().split('\t')[0].split('.')
                if len(parts) >= 2:
                    pid = parts[0].strip()
                    name = parts[1].strip()
                    status = 'Attached' if 'Attached' in line else 'Detached'
                    sessions.append({
                        'pid': pid,
                        'name': name,
                        'status': status
                    })
        return sessions
    except Exception as e:
        print(f"获取screen会话失败: {e}")
        return []

async def get_container_stats(container_id):
    """获取单个容器的资源使用统计"""
    global docker_memory_cache, last_docker_update_time
    current_time = time.time()

    # 检查缓存是否过期
    if current_time - last_docker_update_time < docker_update_interval and container_id in docker_memory_cache:
        return docker_memory_cache[container_id]

    try:
        result = await asyncio.create_subprocess_exec(
            'docker', 'stats', '--no-stream', '--format', '{{.MemUsage}}', container_id,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        stdout, _ = await result.communicate()
        mem_usage = stdout.decode().strip().split(' / ')[0]
        # 转换单位到字节
        if mem_usage.endswith('KiB'):
            memory = int(float(mem_usage[:-3]) * 1024)
        elif mem_usage.endswith('MiB'):
            memory = int(float(mem_usage[:-3]) * 1024 * 1024)
        elif mem_usage.endswith('GiB'):
            memory = int(float(mem_usage[:-3]) * 1024 * 1024 * 1024)
        else:
            memory = 0

        # 更新缓存
        docker_memory_cache[container_id] = memory
        last_docker_update_time = current_time  # 更新最后更新时间
        return memory
    except Exception:
        return 0

async def get_docker_containers():
    """获取Docker容器信息"""
    try:
        result = await asyncio.create_subprocess_exec(
            'docker', 'ps', '-a', '--format', '{{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}', 
            stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        stdout, _ = await result.communicate()
        containers = []
        for line in stdout.decode().strip().split('\n'):
            if not line.strip():
                continue
            container_id, name, status, image = line.strip().split('|')
            # 获取内存使用
            memory_usage = await get_container_stats(container_id)  # 使用缓存
            containers.append({
                'id': container_id,
                'name': name,
                'status': status,
                'image': image,
                'memoryUsage': memory_usage
            })
        return containers
    except Exception as e:
        print(f"获取Docker容器信息失败: {e}")
        return []

async def get_system_info():
    """获取系统信息"""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        'cpu_percent': cpu_percent,
        'memory_total': memory.total,
        'memory_used': memory.used,
        'memory_percent': memory.percent,
        'disk_total': disk.total,
        'disk_used': disk.used,
        'disk_percent': disk.percent,
        'ip_address': get_ip_address(),
        'screen_sessions': get_screen_sessions(),  # 添加screen会话信息
        'docker_containers': await get_docker_containers()  # 异步调用
    }

async def collect_gpu_info():
    gpu_stats = gpustat.GPUStatCollection.new_query()
    gpu_data = []
    
    # 获取所有进程信息
    all_processes = get_all_processes()
    process_map = {proc['pid']: proc for proc in all_processes}
    
    # 处理GPU信息
    for gpu in gpu_stats:
        processes = []
        for proc in gpu.processes:
            pid = proc['pid']
            if pid in process_map:
                process_map[pid]['is_gpu_process'] = True
                process_map[pid]['gpu_memory_usage'] = proc['gpu_memory_usage']
                process_map[pid]['gpu_id'] = gpu.index
                processes.append(process_map[pid])
            
        gpu_data.append({
            'id': gpu.index,
            'name': gpu.name,
            'temperature': gpu.temperature,
            'memory_used': gpu.memory_used,
            'memory_total': gpu.memory_total,
            'utilization': gpu.utilization,
            'processes': processes
        })
    
    # 添加系统信息
    system_info = await get_system_info()  # 异步调用
    system_info['processes'] = all_processes  # 添加所有进程信息
    
    return {
        'hostname': socket.gethostname(),
        'timestamp': datetime.now().isoformat(),
        'gpu_data': gpu_data,
        'system_info': system_info
    }

def report_to_central(data, central_server='http://192.168.2.119:7864'):
    try:
        response = requests.post(f'{central_server}/api/report-gpu-stats', json=data)
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"报告数据失败: {e}")
        return False

async def main():
    while True:
        data = await collect_gpu_info()  # 异步调用
        success = report_to_central(data)
        print(f"数据收集时间: {data['timestamp']}")
        print(f"报告状态: {'成功' if success else '失败'}")
        await asyncio.sleep(1)  # 每1秒收集一次数据

if __name__ == '__main__':
    asyncio.run(main())  # 使用异步主函数
