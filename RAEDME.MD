# GPU Monitor

GPU Monitor 是一个用于监控多台机器 GPU 使用情况的项目，包括客户端、服务端和网页前端三个部分。

## 功能

### 客户端

- 收集机器的 GPU 使用情况，包括温度、内存使用、利用率等
- 收集机器的系统信息，如 CPU 使用率、内存使用率、磁盘使用率等
- 收集机器上运行的进程信息，包括进程名、命令行、CPU 和内存使用率等
- 收集机器上的 Docker 容器信息，包括容器 ID、名称、状态、CPU 和内存使用率等
- 收集机器上的 Screen 会话信息，包括会话 ID、名称和状态
- 将收集到的数据发送到服务端

### 服务端

- 接收来自客户端的数据，并存储在内存中
- 提供 API 接口，供网页前端查询机器的 GPU 和系统信息

### 网页前端

- 以列表或窗口模式显示多台机器的 GPU 和系统信息
- 显示每台机器的 GPU 使用情况，包括温度、内存使用、利用率等
- 显示每台机器的系统信息，如 CPU 使用率、内存使用率、磁盘使用率等
- 显示每台机器上运行的进程信息，并支持按进程名和命令行搜索
- 显示每台机器上的 Docker 容器信息，并支持复制进入容器的命令
- 显示每台机器上的 Screen 会话信息，并支持复制进入会话的命令
- 支持自定义设置，如刷新间隔、默认视图模式等

## 项目结构

```
gpu-monitor/
├── backend/
│   ├── gpu_collector.py
│   └── server.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DockerContainerTable.jsx
│   │   │   └── GPUCard.jsx
│   │   ├── App.jsx
│   │   ├── config.js
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
└── README.md
```

## 环境安装

### 客户端

1. 安装 Python 3.6 或更高版本
2. 安装依赖包：`pip install gpustat psutil requests`

### 服务端

1. 安装 Python 3.6 或更高版本
2. 安装依赖包：`pip install flask flask_cors`

### 网页前端

1. 安装 Node.js 12 或更高版本
2. 进入 `frontend` 目录，运行 `npm install` 安装依赖包

## 使用方法

1. 在每台需要监控的机器上运行客户端：`python backend/gpu_collector.py`
2. 在服务端机器上运行服务端：`python backend/server.py`
3. 在网页前端目录下运行 `npm start` 启动前端页面
4. 在浏览器中打开 `http://localhost:3000` 访问监控页面

## 配置

- 客户端的数据上报间隔和服务端地址可在 `gpu_collector.py` 中修改
- 服务端的监听端口可在 `server.py` 中修改
- 网页前端的服务端 API 地址可在 `frontend/src/config.js` 中修改
