import React from 'react'
import {
  BrowserRouter as Router,
  Route,
  Redirect
} from 'react-router-dom'
import { connect } from 'react-redux';
import './App.css';
import SignIn from './login/login';
import Sala from './sala/index'

class App extends React.Component {
  render() {
    if (this.props.newValue === true){
      return <Router>
              <Route path="/login" component={SignIn}></Route>
              <Redirect to="/login"></Redirect>
          </Router>
    } else {
      return <Router>
        <Route path="/sala" component={Sala}></Route>
        <Redirect to="/sala"></Redirect>
      </Router>
    }
  }
}

const mapStateToProps = store => ({
  newValue: store.clickState.newValue
});

export default connect(mapStateToProps)(App);
