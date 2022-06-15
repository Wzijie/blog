import React, { Suspense } from 'react';
import { Switch, BrowserRouter as Router } from 'react-router-dom';
import { Skeleton } from 'antd';
import { getRouter } from '../../route';
import Container from '../../components/Layout';
import ScrollToTop from './ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Container>
        <Suspense fallback={<Skeleton active />}>
          <Switch>
            {getRouter()}
          </Switch>
        </Suspense>
      </Container>
    </Router>
  );
}

export default App;
