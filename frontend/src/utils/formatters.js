import moment from 'moment';
import { message } from 'antd';

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getTimeAgo = (timestamp) => {
  const now = moment();
  const updateTime = moment(timestamp);
  const diff = now.diff(updateTime);

  if (diff < 0) {
    return '刚刚';
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

export const PASTEL_COLORS = {
  pink: {
    title: 'rgba(255, 182, 193, 0.3)',
    body: 'rgba(255, 182, 193, 0.15)', 
    card: 'rgba(255, 182, 193, 0.25)',
  },
  blue: {
    title: 'rgba(176, 224, 230, 0.3)',
    body: 'rgba(176, 224, 230, 0.15)',
    card: 'rgba(176, 224, 230, 0.25)',
  },
  peach: {
    title: 'rgba(255, 218, 185, 0.3)',
    body: 'rgba(255, 218, 185, 0.15)',
    card: 'rgba(255, 218, 185, 0.25)',
  },
  purple: {
    title: 'rgba(221, 160, 221, 0.3)',
    body: 'rgba(221, 160, 221, 0.15)',
    card: 'rgba(221, 160, 221, 0.25)',
  },
  steelBlue: {
    title: 'rgba(176, 196, 222, 0.3)',
    body: 'rgba(176, 196, 222, 0.15)',
    card: 'rgba(176, 196, 222, 0.25)',
  },
  green: {
    title: 'rgba(152, 251, 152, 0.3)',
    body: 'rgba(152, 251, 152, 0.15)',
    card: 'rgba(152, 251, 152, 0.25)',
  },
  yellow: {
    title: 'rgba(238, 232, 170, 0.3)',
    body: 'rgba(238, 232, 170, 0.15)',
    card: 'rgba(238, 232, 170, 0.25)',
  },
  lavender: {
    title: 'rgba(230, 230, 250, 0.3)',
    body: 'rgba(230, 230, 250, 0.15)',
    card: 'rgba(230, 230, 250, 0.25)',
  },
  thistle: {
    title: 'rgba(216, 191, 216, 0.3)',
    body: 'rgba(216, 191, 216, 0.15)',
    card: 'rgba(216, 191, 216, 0.25)',
  },
  aliceBlue: {
    title: 'rgba(240, 248, 255, 0.3)',
    body: 'rgba(240, 248, 255, 0.15)',
    card: 'rgba(240, 248, 255, 0.25)',
  },
};

export const COLOR_KEYS = Object.keys(PASTEL_COLORS);

export const getColorIndex = (hostname) => {
  let sum = 0;
  for (let i = 0; i < hostname.length; i++) {
    sum += hostname.charCodeAt(i);
  }
  return COLOR_KEYS[sum % COLOR_KEYS.length];
};

export const offlineCardStyle = {
  position: 'relative',
  marginBottom: '24px',
  filter: 'grayscale(1)',
  opacity: 0.85,
  transition: 'all 0.3s ease',
  borderColor: 'rgba(0,0,0,0.15)',
  background: 'rgba(240, 240, 240, 0.5)',
};

export const stripesOverlayStyle = {
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
  zIndex: 3,
};

export const offlineContentStyle = {
  background: 'rgba(200, 200, 200, 0.5)',
  position: 'relative',
  zIndex: 2,
};

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      message.success('命令已复制到剪贴板');
    } else {
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