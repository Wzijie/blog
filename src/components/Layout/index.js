import React from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import navConfig from '../../nav.config';
import Sidebar from './Sidebar';
import styles from './index.module.less';

const { Footer } = Layout;

const Container = ({ children }) => {
  const location = useLocation();

  return (
    <div className={styles.main}>
      <Sidebar pathname={location.pathname} data={navConfig} />
      <div className={styles.content}>
        {children}
        <Footer className="site-layout-background" style={{ textAlign: 'center' }}>备案信息</Footer>
      </div>
    </div>
  );
}

export default Container;
