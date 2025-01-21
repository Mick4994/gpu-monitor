import React from 'react';
import { Modal, Form, Input, InputNumber, Radio, Button, message } from 'antd';

const SettingsModal = ({ visible, setVisible, settings, setSettings }) => {
  const handleSettingsSave = (values) => {
    setSettings(values);
    localStorage.setItem('gpu-monitor-settings', JSON.stringify(values));
    setVisible(false);
    message.success('设置已保存');
    if (values.apiUrl !== settings.apiUrl) {
      window.location.reload();
    }
  };

  return (
    <Modal
      title="设置"
      open={visible}
      onCancel={() => setVisible(false)}
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

export default SettingsModal; 