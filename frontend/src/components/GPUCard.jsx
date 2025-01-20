import React, { useState, useEffect } from 'react';
import { Card, Progress, Table, Tag, Tooltip, Input } from 'antd';
import moment from 'moment';

const { Search } = Input;

const getUtilizationColor = (percent) => {
  if (percent >= 80) return '#ff4d4f';
  if (percent >= 50) return '#ffa940';
  if (percent >= 20) return '#fadb14';
  return '#52c41a';
};

const getTemperatureColor = (temp) => {
  if (temp >= 80) return 'red';
  if (temp >= 60) return 'gold';
  return 'green';
};

const GPUCard = ({ gpuData, parentBackground, isOffline, compactMode }) => {
  const memoryPercent = Math.round((gpuData.memory_used / gpuData.memory_total) * 100);
  const utilizationColor = getUtilizationColor(gpuData.utilization);
  const memoryColor = getUtilizationColor(memoryPercent);
  
  const cardStyle = isOffline ? {
    marginBottom: 16,
    background: 'rgba(200, 200, 200, 0.5)',
    borderColor: 'rgba(0,0,0,0.1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    position: 'relative',
    zIndex: 2,
  } : {
    marginBottom: 16,
    background: parentBackground,
    borderColor: 'rgba(0,0,0,0.1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  };

  const renderCompactInfo = () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Tooltip title="温度">
        <Tag color={getTemperatureColor(gpuData.temperature)}>
          {gpuData.temperature}°C
        </Tag>
      </Tooltip>
      <Tooltip title="GPU利用率">
        <Tag color={utilizationColor}>
          GPU: {gpuData.utilization}%
        </Tag>
      </Tooltip>
      <Tooltip title={`${gpuData.memory_used}MB / ${gpuData.memory_total}MB`}>
        <Tag color={memoryColor}>
          显存: {memoryPercent}%
        </Tag>
      </Tooltip>
    </div>
  );

  const sortProcesses = (processes) => {
    return [...processes].sort((a, b) => {
      const aIsPython = a.name.toLowerCase().includes('python');
      const bIsPython = b.name.toLowerCase().includes('python');
      if (aIsPython && !bIsPython) return -1;
      if (!aIsPython && bIsPython) return 1;
      
      if (a.gpu_memory_usage !== b.gpu_memory_usage) {
        return b.gpu_memory_usage - a.gpu_memory_usage;
      }
      
      return b.create_time - a.create_time;
    });
  };

  const [processFilter, setProcessFilter] = useState('python');
  const [filteredProcesses, setFilteredProcesses] = useState([]);

  useEffect(() => {
    const filtered = sortProcesses(gpuData.processes).filter(process => {
      if (!processFilter) return true;
      const searchLower = processFilter.toLowerCase();
      return (
        process.name.toLowerCase().includes(searchLower) ||
        process.cmdline.toLowerCase().includes(searchLower)
      );
    });
    setFilteredProcesses(filtered);
  }, [gpuData.processes, processFilter]);

  const renderDetailedContent = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h4>温度</h4>
          <Tag color={getTemperatureColor(gpuData.temperature)}>
            {gpuData.temperature}°C
          </Tag>
        </div>
        
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h4>GPU利用率</h4>
            <Progress 
              percent={gpuData.utilization}
              type="circle"
              width={80}
              strokeColor={utilizationColor}
              format={percent => (
                <span style={{ color: utilizationColor }}>
                  {percent}%
                </span>
              )}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h4>显存使用</h4>
            <Progress 
              percent={memoryPercent}
              type="circle"
              width={80}
              strokeColor={memoryColor}
              format={percent => (
                <Tooltip title={`${gpuData.memory_used}MB / ${gpuData.memory_total}MB`}>
                  <span style={{ color: memoryColor }}>
                    {percent}%
                  </span>
                </Tooltip>
              )}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ marginRight: 8, fontWeight: 'bold' }}>GPU进程过滤</span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            (默认显示python进程，支持进程名和命令行模糊搜索)
          </span>
        </div>
        <Search
          placeholder="过滤进程（支持模糊搜索）"
          allowClear
          defaultValue="python"
          onChange={e => setProcessFilter(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table 
        dataSource={filteredProcesses}
        columns={[
          { 
            title: 'PID', 
            dataIndex: 'pid', 
            key: 'pid', 
            width: 80 
          },
          { 
            title: '进程信息', 
            key: 'process',
            render: (_, record) => (
              <div>
                <div><b>进程名称:</b> {record.name}</div>
                <Tooltip title={record.cmdline} placement="topLeft">
                  <div style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    maxWidth: '500px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <b>完整命令:</b> {record.cmdline}
                  </div>
                </Tooltip>
              </div>
            )
          },
          { 
            title: '显存使用', 
            dataIndex: 'gpu_memory_usage', 
            key: 'memory',
            width: 100,
            sorter: (a, b) => a.gpu_memory_usage - b.gpu_memory_usage,
            render: (text) => `${text} MB` 
          },
          {
            title: '启动时间',
            dataIndex: 'create_time',
            key: 'create_time',
            width: 200,
            defaultSortOrder: 'descend',
            sorter: (a, b) => b.create_time - a.create_time,
            render: (timestamp) => moment(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
          }
        ]}
        size="small"
        pagination={false}
        locale={{
          emptyText: '没有匹配的进程'
        }}
      />
    </>
  );

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{gpuData.name} (GPU {gpuData.id})</span>
          {compactMode && renderCompactInfo()}
        </div>
      }
      style={cardStyle}
      bodyStyle={{
        background: isOffline ? 'rgba(220, 220, 220, 0.5)' : 'rgba(255, 255, 255, 0.5)',
        padding: compactMode ? 0 : '24px',
        display: compactMode ? 'none' : 'block'
      }}
    >
      {!compactMode && renderDetailedContent()}
    </Card>
  );
};

export default GPUCard; 