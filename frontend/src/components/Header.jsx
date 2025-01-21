import React from 'react';
import { Layout, Button, Menu, Tag } from 'antd';
import { UnorderedListOutlined, WindowsOutlined, SettingOutlined } from '@ant-design/icons';

const { Header } = Layout;

const AppHeader = ({ viewMode, onViewModeChange, selectedMachine, setSelectedMachine, machines, onSettingsClick }) => {
  const machineOptions = Object.entries(machines || {}).map(([hostname, machineData]) => ({
    key: hostname,
    label: (
      <span>
        {hostname}
        {!machineData.is_online && <Tag color="red" style={{marginLeft: 8}}>离线</Tag>}
      </span>
    )
  }));

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
              onViewModeChange('list');
              setSelectedMachine(null);
            }}
          >
            列表模式
          </Button>
          <Button
            type={viewMode === 'window' ? 'primary' : 'default'}
            icon={<WindowsOutlined />}
            onClick={() => {
              onViewModeChange('window');
              if (!selectedMachine) {
                const firstOnlineMachine = Object.entries(machines || {})
                  .find(([_, data]) => data.is_online)?.[0];
                setSelectedMachine(firstOnlineMachine || Object.keys(machines || {})[0]);
              }
            }}
          >
            窗口模式
          </Button>
        </Button.Group>
        
        {viewMode === 'window' && machineOptions.length > 0 && (
          <Menu 
            mode="horizontal" 
            selectedKeys={[selectedMachine]} 
            onClick={({key}) => setSelectedMachine(key)}
            style={{ marginLeft: 20 }}
            items={machineOptions}
          />
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={onSettingsClick}
        />
      </div>
    </Header>
  );
};

export default AppHeader; 