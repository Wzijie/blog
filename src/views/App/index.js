import React, { Suspense } from 'react';
import { Switch, BrowserRouter as Router } from 'react-router-dom';
import { getRouter } from '../../route';
import Container from '../../components/Layout';

function App() {
  return (
    <Router>
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
