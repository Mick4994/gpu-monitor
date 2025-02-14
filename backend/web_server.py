from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
import logging
from datetime import datetime, timedelta
import json
from flask_sock import Sock  # 添加 WebSocket 支持

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
sock = Sock(app)  # 初始化 WebSocket

# 存储所有机器的GPU数据和客户端信息
gpu_data_store = {}
# 数据过期时间（秒）
DATA_EXPIRY_TIME = 30

machines = {}
last_update_time = {}
websocket_clients = {}  # 存储 WebSocket 连接 {hostname: websocket}

@app.route('/api/report-gpu-stats', methods=['POST'])
def report_gpu_stats():
    """接收各个机器报告的GPU数据"""
    data = request.json
    hostname = data['hostname']
    client_ip = request.remote_addr
    
    if hostname not in gpu_data_store:
        logger.info(f"新主机连接: {hostname} ({client_ip})")
    
    gpu_data_store[hostname] = data
    # logger.info(f"收到来自 {hostname} ({client_ip}) 的更新, 时间戳: {data['timestamp']}")
    
    machines[hostname] = data
    machines[hostname]['is_online'] = True
    last_update_time[hostname] = datetime.now()
    
    return jsonify({'status': 'success'})

@app.route('/api/gpu-stats', methods=['GET'])
def get_gpu_stats():
    """获取所有机器的GPU数据"""
    current_time = datetime.now()
    
    # 添加在线状态到返回数据中
    machines_with_status = {}
    for hostname, data in machines.items():
        time_diff = current_time - last_update_time[hostname]
        is_online = time_diff.total_seconds() <= 10
        
        machines_with_status[hostname] = {
            **data,
            'is_online': is_online
        }
    
    return jsonify({
        'machines': machines_with_status
    })

@app.route('/api/kill-processes', methods=['POST'])
def kill_processes():
    """终止一个或多个进程"""
    try:
        data = request.get_json()
        hostname = data.get('hostname')
        pids = data.get('pids', [])
        
        if not hostname:
            logger.error(f"未提供主机名")
            return jsonify({'status': 'error', 'message': '未提供主机名'}), 400
        if not pids:
            logger.error(f"未提供进程 ID 列表")
            return jsonify({'status': 'error', 'message': '未提供进程 ID 列表'}), 400
        
        if hostname not in websocket_clients:
            logger.warning(f"目标主机 {hostname} 不在线")
            return jsonify({
                'status': 'error',
                'message': '目标主机不在线'
            }), 404
        
        try:
            # 通过 WebSocket 发送终止命令
            ws = websocket_clients[hostname]
            command = {
                'type': 'kill_processes',
                'pids': pids
            }
            ws.send(json.dumps(command))
            
            # 直接返回成功响应，不等待 WebSocket 的响应
            # WebSocket 的响应会在 handle_websocket 中处理
            return jsonify({
                'status': 'success',
                'message': f'命令已发送到客户端'
            })
                
        except Exception as e:
            logger.error(f"向客户端 {hostname} 发送终止命令时发生错误: {e}")
            return jsonify({
                'status': 'error',
                'message': f'向客户端发送命令失败: {str(e)}'
            }), 500
            
    except Exception as e:
        logger.error(f"处理终止进程请求时发生错误: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@sock.route('/ws')
def handle_websocket(ws):
    """处理 WebSocket 连接"""
    hostname = None
    try:
        while True:
            message = ws.receive()
            data = json.loads(message)
            
            if data.get('type') == 'register':
                # 客户端注册
                hostname = data.get('hostname')
                if hostname:
                    websocket_clients[hostname] = ws
                    logger.info(f"客户端 {hostname} WebSocket 连接成功")
                    ws.send(json.dumps({
                        'type': 'register_response',
                        'status': 'success'
                    }))
            elif data.get('type') == 'kill_process_result':
                # 处理进程终止结果
                logger.info(f"收到来自 {hostname} 的进程终止结果: {data}")
                # 这里不需要额外处理，因为结果已经在 kill_processes 函数中处理了
    except Exception as e:
        logger.error(f"WebSocket 错误: {e}")
    finally:
        if hostname and hostname in websocket_clients:
            del websocket_clients[hostname]
            logger.info(f"客户端 {hostname} WebSocket 连接断开")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7864) 