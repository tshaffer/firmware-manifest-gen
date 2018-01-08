import thunkMiddleware from 'redux-thunk';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import { createStore, applyMiddleware } from 'redux';

import reducers from './store/reducers';

import App from './components/app';

const store = createStore(
    reducers,
    applyMiddleware(
        thunkMiddleware,
    ),
);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('content') as HTMLElement,
);
