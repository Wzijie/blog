import React from 'react';
import { NavLink } from 'react-router-dom';
import './index.less';

const Sidebar = ({ data }) => {
  return (
    <div className="sidebar">
      <div className="fixed">
        <ul>
          {data.map(({ name, children }) => {
            return (
              <li key={name}>
                <p>{name}</p>
                <ul>
                  {children.map(({ name: subTitle, path }) => {
                    return <li key={path} className="navItem"><NavLink to={path}>{subTitle}</NavLink></li>
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
