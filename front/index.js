import React from 'react';
import ReactDOM from 'react-dom';
import {createStore, combineReducers, applyMiddleware, compose} from 'redux';
// import {ConnectedRouter, routerMiddleware} from 'react-router-redux';
import thunk from 'redux-thunk';
import {createLogger} from 'redux-logger';
import {Provider} from 'react-redux';
import {App} from "./src/components";
import reducers from './src/components/reducers'

import "./vendor/normalize.css";

const logger = createLogger({duration: true, diff : false});
// const history = createHistory();

const findTypyes = (action) => {
    const types = [
        "SET_DATA_COMPLETE",
        "FILTER"
    ];

    return types.some(type => action.type.indexOf(type) >= 0);
};

const actionSanitizer = action => (
    findTypyes(action) && action.payload ?
        { ...action, payload: "TOO LONG" } : action
);

const reduxDevtoolsExtensionOptions = {
    actionSanitizer
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(reduxDevtoolsExtensionOptions) || compose;
const middleware = process.env.NODE_ENV === 'development' ?
    [thunk] :
    [thunk];

const store = createStore(
    combineReducers(reducers),
    composeEnhancers(applyMiddleware(...middleware))
);

const rootElement = document.getElementById('root');

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    rootElement
);