import React, { Component, PropTypes } from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, useRouterHistory, IndexRedirect } from 'react-router';
import { createHistory } from 'history';

import { Provider, configureStore, combineReducers} from './redux';
import rootReducer, { ACTION_TYPES } from './redux/router';

import Extensions from '@jenkins-cd/js-extensions';

import Config from './config';
import { ToastDrawer } from './components/ToastDrawer';
import { DevelopmentFooter } from './DevelopmentFooter';

let config; // Holder for various app-wide state

/**
 * Root Blue Ocean UI component
 */
class App extends Component {

    getChildContext() {
        return {config};
    }

    render() {
        return (
            <div className="Site">
                <header className="Site-header">
                    <div className="global-header">
                        <Extensions.Renderer extensionPoint="jenkins.logo.top"/>
                        <nav>
                            <Link to="/pipelines">Pipelines</Link>
                            <a href="#">Administration</a>
                        </nav>
                    </div>
                </header>
                <main className="Site-content">
                    {this.props.children /* Set by react-router */ }
                </main>
                <footer className="Site-footer">
                    <DevelopmentFooter />
                </footer>
                <ToastDrawer />
            </div>
        );
    }
}

App.propTypes = {
    children: PropTypes.node
};

App.childContextTypes = {
    config: PropTypes.object
};

class NotFound extends Component {
    // FIXME: We're going to need to polish this up at some point
    render() {
        return <h1>Not found</h1>;
    }
}

function makeRoutes(routes) {
    // Build up our list of top-level routes RR will ignore any non-route stuff put into this list.
    const appRoutes = [
        ...routes,
        // FIXME: Not sure best how to set this up without the hardcoded IndexRedirect :-/
        <IndexRedirect to="/pipelines" />,
        <Route path="*" component={NotFound}/>
    ];

    const routeProps = {
        path: "/",
        component: App
    };

    return React.createElement(Route, routeProps, ...appRoutes);
}


function startApp(routes, stores) {

    const rootElement = document.getElementById("root");
    const headElement = document.getElementsByTagName("head")[0];

    // Look up where the Blue Ocean app is hosted
    let appURLBase = headElement.getAttribute("data-appurl");

    if (typeof appURLBase !== "string") {
        appURLBase = '';
    }

    // Look up some other URLs we may need
    const rootURL = headElement.getAttribute("data-rooturl");
    const resourceURL = headElement.getAttribute("data-resurl");
    const adjunctURL = headElement.getAttribute("data-adjuncturl");

    // Stash urls in our module-local var, so that App can put them on context.
    config = new Config({
        appURLBase,
        rootURL,
        resourceURL,
        adjunctURL
    });

    // Using this non-default history because it allows us to specify the base url for the app
    const history = useRouterHistory(createHistory)({
        basename: appURLBase
    });

    // get all ExtensionPoints related to redux-stores
    let store;
    if (stores.length === 0) {
        // if we do not have any stores we only add the location store
        store = configureStore(combineReducers(rootReducer));
    } else {
        // some plugins provide they own store so combining with loction store
        store = configureStore(combineReducers(
          Object.assign({}, ...stores, rootReducer))
        );
    }

    // on each change of the url we need to update the location object
    history.listen(newLocation => {
        const { dispatch, getState } = store;
        const { current } = getState().location;

        // no current happens on the first request
        if (current) {
            dispatch({
                type: ACTION_TYPES.SET_LOCATION_PREVIOUS,
                payload: current,
            });
        }
        dispatch({
            type: ACTION_TYPES.SET_LOCATION_CURRENT,
            payload: newLocation.pathname,
        });
    });

    // Start React
    render(
        <Provider store={store}>
            <Router history={history}>{ makeRoutes(routes) }</Router>
        </Provider>
      , rootElement);
}

Extensions.store.getExtensions(['jenkins.main.routes', 'jenkins.main.stores'], (routes = [], stores = []) => {
    startApp(routes, stores);
});

// Enable page reload.
require('./reload');
