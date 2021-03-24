import React from 'react';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import styles from '../index.module.less';

const Header = ({ sidebarOpened, onSidebarOpenedToggle }) => {
  const MenuToggle = sidebarOpened ? MenuFoldOutlined : MenuUnfoldOutlined;

  return (
    <header className={`${styles.header} header`}>
      <div className={styles.headerContent}>
        <MenuToggle className={styles.menuToggle} onClick={onSidebarOpenedToggle} />
        <h1 className={styles.title}>杂谈、随笔分享</h1>
      </div>
    </header>
  );
}

export default Header;
