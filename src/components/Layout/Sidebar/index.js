import React from 'react';
import ReactDOM from 'react-dom';
import { NavLink } from 'react-router-dom';
import './sidebar.less';

const RouteList = ({ routes }) => (
  <ul>
    {routes.map(({ name: subTitle, path }) => {
      return (
        <li key={path} className="navItem">
          <NavLink to={path}>{subTitle}</NavLink>
        </li>
      );
    })}
  </ul>
);

const Sidebar = ({ data, sidebarOpened, onSidebarOpenedToggle }) => {
  const sidebarOpenedClassName = sidebarOpened ? 'open' : '';

  const navList = data.filter(({ children }) => Array.isArray(children) && children.length > 0);

  return (
    <div className={`sidebar ${sidebarOpenedClassName}`}>
      <div className="fixed">
        <ul>
          {navList.map(({ name, children }) => {
            return (
              <li key={name} className="group-title">
                <p>{name}</p>
                <RouteList routes={children} />
              </li>
            );
          })}
        </ul>
      </div>
      {
        ReactDOM.createPortal(
          <div className={`sidebar-mask ${sidebarOpenedClassName}`} onClick={onSidebarOpenedToggle} />,
          document.body,
        )
      }
    </div>
  );
}

export default Sidebar;
