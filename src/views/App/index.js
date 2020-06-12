import React, { Suspense } from 'react';
import { Switch, BrowserRouter as Router } from 'react-router-dom';
import { getRouter } from '../../route';
import Container from '../../components/Layout';
import ScrollToTop from './ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Container>
        <Suspense fallback={<div>Loading...</div>}>
          <Switch>
            {getRouter()}
          </Switch>
        </Suspense>
      </Container>
    </Router>
  );
}

export default App;
