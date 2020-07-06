import React from 'react';
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom';
import { connect } from 'react-redux';

import { PrivateRoute, Alert } from './components';
import { HomePage } from './pages/HomePage/home-page';
import { RoomPage } from './pages/RoomPage/room-page';
import { Account } from './account';
import history from './helpers/history';

class App extends React.Component {
  constructor(props) {
    super(props);

    history.listen((location, action) => {
    });
  }
  render() {

    return (
      <div>
        <Router history={history}>
          <Alert />
          <Switch >
            <PrivateRoute exact path="/" component={HomePage} />
            <PrivateRoute exact path="/room/:id" component={RoomPage} />
            <Route path="/account" component={Account} />
          </Switch>
        </Router>
      </div>
    )
  }
}

const connectedApp = connect()(App);
export { connectedApp as App };