import React, { lazy } from 'react';
import { Route, Redirect } from 'react-router-dom';
import navConfig from '../nav.config';

const navRoutes = navConfig.reduce((prev, current) => [...prev, ...current.children], []);

const routes = [{
  path: '/',
  redirect: navRoutes[0].path,
  exact: true,
}, ...navRoutes.map(({ path, ...item }) => {
  return {
    ...item,
    path,
    component: lazy(() => import(`../article/${path.replace('/', '')}.md`)),
  };
})];

console.log(routes, 'routes')

const getRouter = () => {
  return routes.map(({ name, redirect, path, ...rest }) => {
    if (redirect) return <Redirect key={path} from={path} to={redirect} {...rest} />
    return <Route key={path} path={path} {...rest} />;
  });
}

export { routes, getRouter };
