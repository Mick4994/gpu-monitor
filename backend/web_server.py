from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
import logging
from datetime import datetime, timedelta

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 存储所有机器的GPU数据
gpu_data_store = {}
# 数据过期时间（秒）
DATA_EXPIRY_TIME = 30

@app.route('/api/report-gpu-stats', methods=['POST'])
def report_gpu_stats():
    """接收各个机器报告的GPU数据"""
    data = request.json
    hostname = data['hostname']
    client_ip = request.remote_addr
    
    if hostname not in gpu_data_store:
        logger.info(f"新主机连接: {hostname} ({client_ip})")
    
    gpu_data_store[hostname] = data
    logger.info(f"收到来自 {hostname} ({client_ip}) 的更新, 时间戳: {data['timestamp']}")
    
    return jsonify({'status': 'success'})

@app.route('/api/gpu-stats')
def get_gpu_stats():
    """获取所有机器的GPU数据"""
    current_time = datetime.now()
    
    # 添加在线状态到返回数据中
    machines_with_status = {}
    for hostname, data in gpu_data_store.items():
        last_update = datetime.fromisoformat(data['timestamp'])
        is_online = (current_time - last_update) <= timedelta(seconds=DATA_EXPIRY_TIME)
        
        machines_with_status[hostname] = {
            **data,
            'is_online': is_online
        }
    
    return jsonify({
        'machines': machines_with_status
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7864) 