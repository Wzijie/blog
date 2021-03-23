import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import navConfig from '../../nav.config';
import { routes } from '../../route';
import styles from './index.module.less';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Header from './Header';
import ThemeWidgets from './ThemeWidgets';

const routePathInNameMap = routes.reduce((prev, { path, name }) => {
  return { ...prev, [path]: name };
}, {})

const Container = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    document.title = `${routePathInNameMap[location.pathname]} - Wzijie Blog`;
  }, [location]);

  return (
    <div className={styles.main}>
      <Header />
      <Sidebar pathname={location.pathname} data={navConfig} />
      <div className={styles.content}>
        {children}
        <Footer />
      </div>
      <ThemeWidgets />
    </div>
  );
}

export default Container;
