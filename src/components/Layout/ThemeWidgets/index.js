import React, { useState, useEffect } from 'react';
import { Menu, Dropdown } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import styles from './index.module.less';

const LIGHT_MODE = 'light';
const DARK_MODE = 'dark';

// 获取初始主题
const getInitialDarkMode = () => {
  const themeMode = localStorage.getItem('themeMode');
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (themeMode) return themeMode;
  return isDarkMode ? DARK_MODE : LIGHT_MODE;
}

const useThemeMode = () => {
  const initialTheme = getInitialDarkMode();

  const [themeMode, setThemeMode] = useState(initialTheme);

  // 根据主题变化设置样式
  useEffect(() => {
    if (themeMode === DARK_MODE) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [themeMode]);

  // 关闭页面时保存主题到本地
  useEffect(() => {
    const saveThemeMode = () => localStorage.setItem('themeMode', themeMode);
    window.addEventListener('beforeunload', saveThemeMode);
    return () => window.removeEventListener('beforeunload', saveThemeMode);
  }, [themeMode]);

  return [themeMode, setThemeMode];
}

// 监听系统主题变化进行响应
const useSystemDarkModeChange = onChange => {
  const matchMedia = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

  useEffect(() => {
    const setThemeMode = e => onChange(e.matches ? DARK_MODE : LIGHT_MODE);

    const hasEventListener = matchMedia.addEventListener && matchMedia.removeEventListener;

    // 兼容处理，已知safari不支持matchMedia的addEventListener方法
    hasEventListener
      ? matchMedia.addEventListener('change', setThemeMode)
      : matchMedia.addListener(setThemeMode);

    return () => {
      hasEventListener
        ? matchMedia.removeEventListener('change', setThemeMode)
        : matchMedia.removeListener(setThemeMode);
    }
  }, [matchMedia, onChange]);
}

const ThemeWidgets = () => {

  const [themeMode, setThemeMode] = useThemeMode();

  useSystemDarkModeChange(setThemeMode);

  const handleClick = ({ key }) => setThemeMode(key);

  const menu = (
    <Menu selectedKeys={[themeMode]} theme={themeMode} onClick={handleClick}>
      <Menu.Item key="light">默认模式</Menu.Item>
      <Menu.Item key="dark">暗黑模式</Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} placement="topCenter">
      <div className={`${styles.themeWidgets} themeWidgets`}>
        <SettingOutlined />
      </div>
    </Dropdown>
  );
}

export default ThemeWidgets;
