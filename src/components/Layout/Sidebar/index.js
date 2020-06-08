import React from 'react';
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

const Sidebar = ({ data }) => {
  return (
    <div className="sidebar">
      <div className="fixed">
        <ul>
          {data.map(({ name, children }) => {
            return (
              <li key={name} className="group-title">
                <p>{name}</p>
                <RouteList routes={children} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
