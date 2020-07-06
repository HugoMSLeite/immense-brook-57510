import React from 'react';
import { render } from 'react-dom';
import './index.css';
import { App } from './App';
import { Provider } from 'react-redux';
import { store } from './helpers/store';
import { userService } from './services';

userService.refreshToken().finally(startApp);

function startApp() {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
}