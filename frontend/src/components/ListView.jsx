import React from 'react';
import { Card, Row, Col, Tag, Table, Button, Modal, Tooltip } from 'antd';
import { CaretRightOutlined, CaretDownOutlined, CopyOutlined } from '@ant-design/icons';
import GPUCard from './GPUCard';
import { formatBytes, getTimeAgo, getColorIndex, offlineCardStyle, stripesOverlayStyle, offlineContentStyle, PASTEL_COLORS, copyToClipboard } from '../utils/formatters';
import { AutoComplete } from 'antd';
import DockerContainerTable from './DockerContainerTable';

const ListView = ({ machines, compactModes, setCompactModes, searchText, setSearchText, settings }) => {
  const handleCompactModeChange = (hostname, value) => {
    setCompactModes(prev => ({
      ...prev,
      [hostname]: value
    }));
  };

  const renderProcessSearch = (machineData) => {
    const allProcesses = machineData?.system_info?.processes || [];
    
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
          listHeight={400}
          dropdownStyle={{
            maxHeight: '400px',
            overflow: 'auto'
          }}
          placeholder="输入关键字搜索进程..."
          options={getProcessOptions(allProcesses, searchText)}
          onSearch={setSearchText}
          notFoundContent="没有匹配的进程"
        />
      </div>
    );
  };

  const renderScreenSessions = (machineData) => {
    const { system_info } = machineData;
    if (!system_info?.screen_sessions?.length) return null;

    const handleScreenCopy = (session) => {
      if (session.status === 'Attached') {
        Modal.confirm({
          title: '会话已被连接',
          content: '当前会话已被其他用户连接,是否继续?',
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

  const getConnectionStatus = (machineData) => {
    if (!machineData.is_online) {
      return <Tag color="red">离线</Tag>;
    }
    return <Tag color="green">在线</Tag>;
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
            {!isCompact && (
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
                    compactMode={isCompact}
                    settings={settings}
                    hostname={hostname}
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
};

export default ListView; 