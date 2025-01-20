import React from 'react';
import { Table, Tag, Tooltip, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DockerContainerTable = ({ containers }) => {
  const handleCopyCommand = (containerId) => {
    navigator.clipboard.writeText(`docker exec -it ${containerId} bash`)
      .then(() => message.success('命令已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h4>Docker 容器</h4>
      <Table
        dataSource={containers}
        columns={[
          {
            title: '容器ID',
            dataIndex: 'id',
            key: 'id',
            width: 120,
            render: (id) => <span>{id.substring(0, 12)}</span>
          },
          {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Button
                  type="link"
                  onClick={() => handleCopyCommand(record.id)}
                  style={{ padding: 0 }}
                >
                  {name}
                </Button>
                <Tooltip title="点我复制进入容器命令">
                  <CopyOutlined 
                    style={{ color: '#1890ff', cursor: 'pointer' }}
                    onClick={() => handleCopyCommand(record.id)}
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
            render: (status) => {
              let color = 'default';
              if (status.includes('Up')) color = 'green';
              else if (status.includes('Exited')) color = 'red';
              return <Tag color={color}>{status}</Tag>;
            }
          },
          {
            title: 'CPU使用',
            dataIndex: 'cpuPercent',
            key: 'cpuPercent',
            width: 100,
            render: (percent) => {
              const value = percent || 0; // 添加默认值处理
              return `${value.toFixed(1)}%`;
            }
          },
          {
            title: '内存使用',
            dataIndex: 'memoryUsage',
            key: 'memoryUsage',
            width: 120,
            render: (usage) => formatBytes(usage)
          },
          {
            title: '镜像',
            dataIndex: 'image',
            key: 'image',
            ellipsis: true
          }
        ]}
        size="small"
        pagination={false}
      />
    </div>
  );
};

export default DockerContainerTable;
