import React from 'react';
import { useLocation } from 'react-router-dom';
import navConfig from '../../nav.config';
import styles from './index.module.less';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Header from './Header';

const Container = ({ children }) => {
  const location = useLocation();

  return (
    <div className={styles.main}>
      <Header />
      <Sidebar pathname={location.pathname} data={navConfig} />
      <div className={styles.content}>
        {children}
        <Footer />
      </div>
    </div>
  );
}

export default Container;
