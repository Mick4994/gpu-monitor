import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Row, Col, Card, Tag, notification, Tooltip, Table, message, Button, AutoComplete, Modal, Menu, Form, Input, InputNumber, Radio } from 'antd';
import moment from 'moment';
import 'moment/locale/zh-cn';
import GPUCard from './components/GPUCard';
import DockerContainerTable from './components/DockerContainerTable';
import { API_BASE_URL } from './config';
import { UnorderedListOutlined, WindowsOutlined, CaretRightOutlined, CaretDownOutlined, SettingOutlined, CopyOutlined } from '@ant-design/icons';

moment.locale('zh-cn');

const { Content, Header } = Layout;

// 修改马卡龙配色方案，增加标题和主体的颜色
const PASTEL_COLORS = {
  pink: {
    title: 'rgba(255, 182, 193, 0.3)',    // 浅粉红-标题
    body: 'rgba(255, 182, 193, 0.15)',    // 浅粉红-主体
    card: 'rgba(255, 182, 193, 0.25)',    // 浅粉红-GPU卡片
  },
  blue: {
    title: 'rgba(176, 224, 230, 0.3)',    // 粉蓝
    body: 'rgba(176, 224, 230, 0.15)',
    card: 'rgba(176, 224, 230, 0.25)',
  },
  peach: {
    title: 'rgba(255, 218, 185, 0.3)',    // 桃色
    body: 'rgba(255, 218, 185, 0.15)',
    card: 'rgba(255, 218, 185, 0.25)',
  },
  purple: {
    title: 'rgba(221, 160, 221, 0.3)',    // 梅红
    body: 'rgba(221, 160, 221, 0.15)',
    card: 'rgba(221, 160, 221, 0.25)',
  },
  steelBlue: {
    title: 'rgba(176, 196, 222, 0.3)',    // 淡钢蓝
    body: 'rgba(176, 196, 222, 0.15)',
    card: 'rgba(176, 196, 222, 0.25)',
  },
  green: {
    title: 'rgba(152, 251, 152, 0.3)',    // 淡绿
    body: 'rgba(152, 251, 152, 0.15)',
    card: 'rgba(152, 251, 152, 0.25)',
  },
  yellow: {
    title: 'rgba(238, 232, 170, 0.3)',    // 淡黄
    body: 'rgba(238, 232, 170, 0.15)',
    card: 'rgba(238, 232, 170, 0.25)',
  },
  lavender: {
    title: 'rgba(230, 230, 250, 0.3)',    // 薰衣草
    body: 'rgba(230, 230, 250, 0.15)',
    card: 'rgba(230, 230, 250, 0.25)',
  },
  thistle: {
    title: 'rgba(216, 191, 216, 0.3)',    // 蓟色
    body: 'rgba(216, 191, 216, 0.15)',
    card: 'rgba(216, 191, 216, 0.25)',
  },
  aliceBlue: {
    title: 'rgba(240, 248, 255, 0.3)',    // 爱丽丝蓝
    body: 'rgba(240, 248, 255, 0.15)',
    card: 'rgba(240, 248, 255, 0.25)',
  },
};

const COLOR_KEYS = Object.keys(PASTEL_COLORS);

// 修改获取颜色索引的函数
const getColorIndex = (hostname) => {
  let sum = 0;
  for (let i = 0; i < hostname.length; i++) {
    sum += hostname.charCodeAt(i);
  }
  return COLOR_KEYS[sum % COLOR_KEYS.length];
};

// 修改离线卡片样式
const offlineCardStyle = {
  position: 'relative',
  marginBottom: '24px',
  filter: 'grayscale(1)',  // 完全灰度
  opacity: 0.85,
  transition: 'all 0.3s ease',
  borderColor: 'rgba(0,0,0,0.15)',
  background: 'rgba(240, 240, 240, 0.5)',  // 添加灰色背景
};

// 修改斜条纹遮罩层样式
const stripesOverlayStyle = {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: `repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.05),
    rgba(0, 0, 0, 0.05) 10px,
    rgba(0, 0, 0, 0.1) 10px,
    rgba(0, 0, 0, 0.1) 20px
  )`,
  pointerEvents: 'none',
  zIndex: 3,  // 确保在所有内容之上
};

// 添加离线状态的内容样式
const offlineContentStyle = {
  background: 'rgba(200, 200, 200, 0.5)',  // 更深的灰色背景
  position: 'relative',
  zIndex: 2,
};

// 添加格式化函数
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 添加 getTimeAgo 函数
const getTimeAgo = (timestamp) => {
  const now = moment();
  const updateTime = moment(timestamp);
  const diff = now.diff(updateTime);

  if (diff < 0) {
    return '刚刚'; // 如果时间差为负，则显示“刚刚”
  }

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) {
    return `${seconds}秒前`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }

  const days = Math.floor(hours / 24);
  return `${days}天前`;
};

function App() {
  const [machines, setMachines] = useState({});
  const [isConnected, setIsConnected] = useState(true);
  const [compactModes, setCompactModes] = useState({});
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 默认为列表模式
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('gpu-monitor-settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      apiUrl: API_BASE_URL,
      refreshInterval: 5000,
      defaultViewMode: 'list'
    };
  });

  // 使用 useCallback 缓存通知函数
  const showConnectionError = useCallback(() => {
    notification.error({
      message: '连接断开',
      description: '无法连接到服务器，请检查网络连接',
      duration: 0,
      placement: 'topRight',
      key: 'connection-error'
    });
  }, []);

  const showConnectionSuccess = useCallback(() => {
    notification.success({
      message: '连接恢复',
      description: '已重新连接到服务器',
      duration: 3,
      placement: 'topRight',
      key: 'connection-success'
    });
  }, []);

  useEffect(() => {
    const fetchGPUStats = async () => {
      try {
        const response = await fetch(`${settings.apiUrl}/api/gpu-stats`);
        const data = await response.json();
        
        // 合并新数据，保留离线机器的数据
        setMachines(prevMachines => {
          const newMachines = { ...prevMachines };
          Object.entries(data.machines).forEach(([hostname, machineData]) => {
            newMachines[hostname] = machineData;
          });
          return newMachines;
        });

        if (!isConnected) {
          notification.destroy('connection-error');
          showConnectionSuccess();
          setIsConnected(true);
        }
      } catch (error) {
        console.error('获取GPU数据失败:', error);
        if (isConnected) {
          showConnectionError();
          setIsConnected(false);
        }
      }
    };

    fetchGPUStats();
    const interval = setInterval(fetchGPUStats, settings.refreshInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [isConnected, showConnectionError, showConnectionSuccess, settings]);

  const getConnectionStatus = (machineData) => {
    if (!machineData.is_online) {
      return <Tag color="red">离线</Tag>;
    }
    return <Tag color="green">在线</Tag>;
  };

  const renderSystemInfo = (machineData) => {
    const { system_info } = machineData;
    if (!system_info) return null;

    return (
      <>
        <Tag color="cyan" style={{ marginLeft: 8 }}>
          IP: {system_info.ip_address}
        </Tag>
        <Tooltip title={`已用: ${formatBytes(system_info.memory_used)}\n总共: ${formatBytes(system_info.memory_total)}`}>
          <Tag color="blue" style={{ marginLeft: 8 }}>
            内存: {system_info.memory_percent}%
          </Tag>
        </Tooltip>
        <Tag color="green" style={{ marginLeft: 8 }}>
          CPU: {system_info.cpu_percent}%
        </Tag>
        <Tooltip title={`已用: ${formatBytes(system_info.disk_used)}\n总共: ${formatBytes(system_info.disk_total)}`}>
          <Tag color="orange" style={{ marginLeft: 8 }}>
            磁盘: {system_info.disk_percent}%
          </Tag>
        </Tooltip>
      </>
    );
  };

  // 添加切换单个机器简约模式的处理函数
  const handleCompactModeChange = (hostname, value) => {
    setCompactModes(prev => ({
      ...prev,
      [hostname]: value
    }));
  };

  // 修改复制命令到剪贴板的函数
  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 对于 HTTPS 环境
        await navigator.clipboard.writeText(text);
        message.success('命令已复制到剪贴板');
      } else {
        // 对于 HTTP 环境的后备方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
          message.success('命令已复制到剪贴板');
        } catch (error) {
          console.error('复制失败:', error);
          message.error('复制失败');
        }
      }
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
  };

  // 修改渲染screen会话的函数
  const renderScreenSessions = (machineData) => {
    const { system_info } = machineData;
    if (!system_info?.screen_sessions?.length) return null;

    const handleScreenCopy = (session) => {
      if (session.status === 'Attached') {
        Modal.confirm({
          title: '会话已被连接',
          content: '当前会话已被其他用户连接，是否继续？',
          okText: '继续',
          cancelText: '取消',
          onOk() {
            copyToClipboard(`screen -x ${session.name}`);
          }
        });
      } else {
        copyToClipboard(`screen -R ${session.name}`);
      }
    };

    return (
      <div style={{ marginTop: 16 }}>
        <h4>Screen 会话</h4>
        <Table
          dataSource={system_info.screen_sessions}
          columns={[
            {
              title: 'PID',
              dataIndex: 'pid',
              key: 'pid',
              width: 100
            },
            {
              title: '会话名称',
              dataIndex: 'name',
              key: 'name',
              render: (name, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Button
                    type="link"
                    onClick={() => handleScreenCopy(record)}
                    style={{ padding: 0 }}
                  >
                    {name}
                  </Button>
                  <Tooltip title="点我复制进入会话命令">
                  <CopyOutlined 
                    style={{ color: '#1890ff', cursor: 'pointer' }}
                    onClick={() => handleScreenCopy(record)}
                  />
                </Tooltip>
              </div>
              )
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 120,
              render: (status) => (
                <Tag color={status === 'Attached' ? 'green' : 'orange'}>
                  {status}
                </Tag>
              )
            }
          ]}
          size="small"
          pagination={false}
        />
      </div>
    );
  };

  const renderDockerContainers = (machineData) => {
    const { system_info } = machineData;
    if (!system_info?.docker_containers?.length) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <h4>Docker 容器</h4>
        <DockerContainerTable containers={system_info.docker_containers} />
      </div>
    );
  };

  // 修改进程搜索相关函数
  const getAllProcesses = (machineData) => {
    if (!machineData?.system_info?.processes) return [];
    return machineData.system_info.processes;
  };

  const getProcessOptions = (processes, searchText) => {
    if (!searchText) return [];
    
    const searchLower = searchText.toLowerCase();
    return processes
      .filter(process => 
        process.name.toLowerCase().includes(searchLower) ||
        process.cmdline.toLowerCase().includes(searchLower)
      )
      .map(process => ({
        value: process.pid.toString(),
        label: (
          <div style={{ padding: '4px 0' }}>
            <div style={{ fontWeight: 'bold' }}>
              [{process.pid}] {process.name}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '500px'
            }}>
              {process.cmdline}
            </div>
            <div style={{ fontSize: '12px', color: '#1890ff' }}>
              CPU: {process.cpu_percent.toFixed(1)}% | 
              内存: {process.memory_percent.toFixed(1)}%
              {process.is_gpu_process && ` | GPU ${process.gpu_id}: ${process.gpu_memory_usage}MB`}
            </div>
          </div>
        )
      }));
  };

  // 修改渲染函数，添加进程搜索部分
  const renderProcessSearch = (machineData) => {
    const allProcesses = getAllProcesses(machineData);
    
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ marginRight: 8, fontWeight: 'bold' }}>全机进程搜索</span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            (支持进程名和命令行模糊搜索)
          </span>
        </div>
        <AutoComplete
          style={{ width: '100%' }}
          dropdownMatchSelectWidth={true}
          listHeight={400}        // 设置下拉列表的高度
          dropdownStyle={{
            maxHeight: '400px',   // 设置下拉菜单的最大高度
            overflow: 'auto'      // 超出时显示滚动条
          }}
          placeholder="输入关键字搜索进程..."
          options={getProcessOptions(allProcesses, searchText)}
          onSearch={setSearchText}
          notFoundContent="没有匹配的进程"
        />
      </div>
    );
  };

  // 添加设置相关函数
  const handleSettingsSave = (values) => {
    setSettings(values);
    localStorage.setItem('gpu-monitor-settings', JSON.stringify(values));
    setSettingsVisible(false);
    message.success('设置已保存');
    // 如果API地址改变，需要刷新页面
    if (values.apiUrl !== settings.apiUrl) {
      window.location.reload();
    }
  };

  // 修改渲染导航栏的函数
  const renderHeader = () => {
    return (
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button.Group>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => {
                setViewMode('list');
                setSelectedMachine(null); // 切换到列表模式时清除选中的机器
              }}
            >
              列表模式
            </Button>
            <Button
              type={viewMode === 'window' ? 'primary' : 'default'}
              icon={<WindowsOutlined />}
              onClick={() => {
                setViewMode('window');
                // 切换到窗口模式时，如果没有选中的机器，默认选中第一个在线的机器
                if (!selectedMachine) {
                  const firstOnlineMachine = Object.entries(machines)
                    .find(([_, data]) => data.is_online)?.[0];
                  setSelectedMachine(firstOnlineMachine || Object.keys(machines)[0]);
                }
              }}
            >
              窗口模式
            </Button>
          </Button.Group>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {viewMode === 'window' && (
            <Menu 
              mode="horizontal" 
              selectedKeys={[selectedMachine]} 
              onClick={({key}) => setSelectedMachine(key)}
              style={{ flex: 1, marginRight: 20 }}
            >
              {Object.entries(machines).map(([hostname, machineData]) => (
                <Menu.Item key={hostname}>
                  {hostname}
                  {!machineData.is_online && <Tag color="red" style={{marginLeft: 8}}>离线</Tag>}
                </Menu.Item>
              ))}
            </Menu>
          )}
          
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
          />
        </div>
      </Header>
    );
  };

  // 添加设置对话框
  const renderSettingsModal = () => {
    return (
      <Modal
        title="设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
      >
        <Form
          initialValues={settings}
          onFinish={handleSettingsSave}
          layout="vertical"
        >
          <Form.Item
            label="API 地址"
            name="apiUrl"
            rules={[{ required: true, message: '请输入API地址' }]}
          >
            <Input placeholder="例如: http://localhost:7864" />
          </Form.Item>

          <Form.Item
            label="刷新间隔 (毫秒)"
            name="refreshInterval"
            rules={[
              { required: true, message: '请输入刷新间隔' },
              { type: 'number', min: 1000, message: '最小间隔1000毫秒' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              step={1000}
              placeholder="例如: 5000"
            />
          </Form.Item>

          <Form.Item
            label="默认浏览模式"
            name="defaultViewMode"
            rules={[{ required: true, message: '请选择默认浏览模式' }]}
          >
            <Radio.Group>
              <Radio value="list">列表模式</Radio>
              <Radio value="window">窗口模式</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // 修改渲染内容的函数
  const renderContent = () => {
    if (viewMode === 'list') {
      return Object.entries(machines).map(([hostname, machineData]) => {
        const isCompact = compactModes[hostname] !== false;
        
        return (
          <div key={hostname} style={{ position: 'relative' }}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={() => handleCompactModeChange(hostname, !isCompact)}
                  >
                    {isCompact ? (
                      <CaretRightOutlined style={{ fontSize: '24px', color: '#666' }} />
                    ) : (
                      <CaretDownOutlined style={{ fontSize: '24px', color: '#666' }} />
                    )}
                    <span>主机: {hostname}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {renderSystemInfo(machineData)}
                    {getConnectionStatus(machineData)}
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      最后更新: {getTimeAgo(machineData.timestamp)}
                    </Tag>
                  </div>
                </div>
              }
              style={{ 
                ...(machineData.is_online ? {} : offlineCardStyle)
              }}
              headStyle={{
                background: machineData.is_online ? PASTEL_COLORS[getColorIndex(hostname)].title : 'rgba(200, 200, 200, 0.7)',
                position: 'relative',
                zIndex: 2,
              }}
              bodyStyle={{
                ...(machineData.is_online ? {} : offlineContentStyle)
              }}
            >
              <div style={{ position: 'relative' }}>
                {!isCompact && ( // 使用 isCompact 变量
                  <>
                    {renderProcessSearch(machineData)}
                    <div style={{ marginBottom: machineData.gpu_data.length > 0 ? 16 : 0 }}>
                      {renderScreenSessions(machineData)}
                      {renderDockerContainers(machineData)}
                    </div>
                  </>
                )}
                
                <Row gutter={[16, 16]}>
                  {machineData.gpu_data.map(gpu => (
                    <Col span={24} key={gpu.id}>
                      <GPUCard 
                        gpuData={gpu} 
                        parentBackground={PASTEL_COLORS[getColorIndex(hostname)].card}
                        isOffline={!machineData.is_online}
                        compactMode={isCompact} // 使用 isCompact 变量
                      />
                    </Col>
                  ))}
                </Row>
                {!machineData.is_online && <div style={stripesOverlayStyle} />}
              </div>
            </Card>
          </div>
        );
      });
    } else {
      // 窗口模式下只显示选中的机器
      if (!selectedMachine || !machines[selectedMachine]) {
        return (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            请在上方选择要查看的机器
          </div>
        );
      }

      const [hostname, machineData] = [selectedMachine, machines[selectedMachine]];
      // 窗口模式下不使用简约模式
      
      return (
        <div key={hostname} style={{ position: 'relative' }}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>主机: {hostname}</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderSystemInfo(machineData)}
                  {getConnectionStatus(machineData)}
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    最后更新: {getTimeAgo(machineData.timestamp)}
                  </Tag>
                </div>
              </div>
            }
            style={{
              margin: '24px',
              ...(machineData.is_online ? {} : offlineCardStyle)
            }}
            headStyle={{
              background: machineData.is_online ? PASTEL_COLORS[getColorIndex(hostname)].title : 'rgba(200, 200, 200, 0.7)',
              position: 'relative',
              zIndex: 2,
            }}
            bodyStyle={{
              ...(machineData.is_online ? {} : offlineContentStyle)
            }}
          >
            <div style={{ position: 'relative' }}>
              {renderProcessSearch(machineData)}
              <div style={{ marginBottom: machineData.gpu_data.length > 0 ? 16 : 0 }}>
                {renderScreenSessions(machineData)}
              </div>
              
              <Row gutter={[16, 16]}>
                {machineData.gpu_data.map(gpu => (
                  <Col span={24} key={gpu.id}>
                    <GPUCard 
                      gpuData={gpu} 
                      parentBackground={PASTEL_COLORS[getColorIndex(hostname)].card}
                      isOffline={!machineData.is_online}
                      compactMode={false} // 窗口模式下始终使用详细模式
                    />
                  </Col>
                ))}
              </Row>
              {!machineData.is_online && <div style={stripesOverlayStyle} />}
            </div>
          </Card>
        </div>
      );
    }
  };

  // 修改返回的 JSX
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {renderHeader()}
      <Content style={{ padding: '24px', overflowY: 'auto' }}>
        {renderContent()}
      </Content>
      {renderSettingsModal()}
    </Layout>
  );
}

export default App; 
