import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import axios from 'axios';
import ListView from './components/ListView';
import WindowView from './components/WindowView';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import { API_BASE_URL } from './config';

const { Content } = Layout;

const App = () => {
  const [machines, setMachines] = useState({});
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    const savedSettings = localStorage.getItem('gpu-monitor-settings');
    const defaultViewMode = savedSettings ? JSON.parse(savedSettings).defaultViewMode : 'list';
    return defaultViewMode;
  });
  const [compactModes, setCompactModes] = useState({});
  const [searchText, setSearchText] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('gpu-monitor-settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      apiUrl: API_BASE_URL,
      refreshInterval: 5000,
      defaultViewMode: 'list',
    };
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${settings.apiUrl}/api/gpu-stats`);
        setMachines(response.data.machines || {});
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, settings.refreshInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [settings.apiUrl, settings.refreshInterval]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSettings(prevSettings => ({
      ...prevSettings,
      defaultViewMode: mode,
    }));
    localStorage.setItem('gpu-monitor-settings', JSON.stringify({
      ...settings,
      defaultViewMode: mode,
      }));
  };
    
    return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onSettingsClick={() => setSettingsVisible(true)}
        selectedMachine={selectedMachine}
        setSelectedMachine={setSelectedMachine}
        machines={machines}
      />
      <Content style={{ padding: '24px', position: 'relative' }}>
        {viewMode === 'list' ? (
          <ListView
            machines={machines}
            compactModes={compactModes}
            setCompactModes={setCompactModes}
            searchText={searchText}
            setSearchText={setSearchText}
            settings={settings}
          />
        ) : (
          <WindowView
            selectedMachine={selectedMachine}
            machines={machines}
            searchText={searchText}
            setSearchText={setSearchText}
            settings={settings}
          />
        )}
        <SettingsModal
          visible={settingsVisible}
          setVisible={setSettingsVisible}
          settings={settings}
          setSettings={setSettings}
        />
      </Content>
    </Layout>
  );
};

export default App; 
