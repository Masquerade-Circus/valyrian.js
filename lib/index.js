import RouterFactory from './router';
import h from './h';
import Request from './request';
import patchFactory from './patch';

function isComponent(component) {
    return typeof component === 'object' &&
        component !== null &&
        typeof component.view === 'function';
};

function assignAttributes(component, attributes) {
    Object.assign(component, h.isVnode(attributes) || Array.isArray(attributes) ? {children: attributes} : attributes);
};

function render(component, attributes) {
    assignAttributes(component, attributes);
    return h.flatenArray(component.view());
};

function v(...args) {
    if (isComponent(args[0])) {
        return render.apply(v, args);
    }

    return h.apply(h, args);
};

function addEvent(container, events, handler, useCapture) {
    if (v.is.browser) {
        events.split(' ').forEach(event => {
            container.addEventListener(
                event,
                handler,
                useCapture
            );
        });
    }
}

function removeEvent(container, events, handler) {
    if (v.is.browser) {
        events.split(' ').forEach(event => {
            container.removeEventListener(
                event,
                handler
            );
        });
    }
}

v.request = Request;
v.router = RouterFactory;
v.is = {};
v.is.node = typeof window === 'undefined';
v.is.browser = !v.is.node;
v.is.mounted = false;

v.window = v.is.node ? (new (require('jsdom')).JSDOM()).window : window;

let patch = patchFactory(v),
    container,
    parent,
    rootTree,
    oldTree,
    rootComponent,
    mainRouter,
    RoutesContainer;

function resetToDefaults() {
    v.is.mounted = false;
    container = v.window.document.createElement('div');
    v.window.document.createElement('div').appendChild(container);
    rootTree = h.vnode(container);
    oldTree = Object.assign({}, rootTree);
};
resetToDefaults();

v.trust = function (htmlString) {
    let div = v.window.document.createElement('div');
    div.innerHTML = htmlString.trim();

    return Array.prototype.map.call(div.childNodes, item => h.vnode(item));
};

v.mount = function (elementContainer, component, attributes) {
    if (elementContainer === undefined) {
        throw new Error('A container element is required as first element');
        return;
    }

    if (!isComponent(component)) {
        throw new Error('A component is required as a second argument');
        return;
    }

    if (v.is.browser && container) {
        removeEvent(container, 'mouseup keyup', v.update);
    }

    container = v.is.node ? v.window.document.createElement('div') : typeof elementContainer === 'string' ? v.window.document.querySelectorAll(elementContainer)[0] : elementContainer;
    rootTree = h.vnode(container);
    oldTree = Object.assign({}, rootTree);
    if (v.is.browser) {
        addEvent(container, 'mouseup keyup', v.update, false);
    }

    return v.update(component, attributes);
};

function redraw(component, attributes) {
    if (isComponent(component)) {
        assignAttributes(component, attributes);
        rootComponent = component;
        rootTree.props = {};
        Object.keys(rootComponent).forEach(prop => {
            if (typeof rootComponent[prop] === 'function') {
                rootTree.props[prop] = (...args) => rootComponent[prop].apply(rootComponent, args);
            }
        });
    };

    if (rootComponent) {
        if (v.is.node) {
            resetToDefaults();
        }

        rootTree.children = render(rootComponent);

        // console.log('******************************');
        patch(rootTree.dom.parentElement, rootTree, oldTree);
        // console.log('******************************');

        oldTree = Object.assign({}, rootTree);
        if (!v.is.mounted) {
            v.is.mounted = true;
        }
    }
    return v.is.node ? rootTree.dom.innerHTML : rootTree.dom.parentElement;
};

v.update = function (component, attributes) {
    return v.is.browser
        ? requestAnimationFrame(() => redraw(component, attributes))
        : redraw(component, attributes);
};

function runRoute(url = '/', parentComponent = undefined) {
    return mainRouter(url)
        .then(response => {
            if (!isComponent(response)) {
                throw new Error('A component is required as response to a route');
                return;
            }

            if (parentComponent) {
                assignAttributes(parentComponent, v(response));
                response = parentComponent;
            }

            if (v.is.node || !v.is.mounted) {
                return v.mount(RoutesContainer, response, {params: mainRouter.params});
            }

            return v.update(response, {params: mainRouter.params});
        });
};

v.routes = function (elementContainer, router) {
    if (elementContainer && router) {
        mainRouter = router;
        RoutesContainer = elementContainer;
        // Activate the use of the router
        if (v.is.browser) {
            function onPopStateGoToRoute() {
                v.routes.go(document.location.pathname);
            }
            addEvent(window, 'popstate', onPopStateGoToRoute, false);
            onPopStateGoToRoute();
        }
        return;
    }

    let routes = [];
    mainRouter.paths.forEach(path => {
        if (path.method === 'get') {
            routes.push(path.path === '' ? '/' : path.path);
        }
    });
    return routes;
};

v.routes.current = '/';
v.routes.params = {};

v.routes.go = function (url, parentComponent) {
    if (v.is.browser) {
        window.history.pushState({}, '', url);
    }

    return runRoute(url, parentComponent);
};

if (v.is.browser) {
    v.sw = function (file = v.sw.file, options = v.sw.options) {
        return navigator.serviceWorker.register(file, options)
            .then(() => navigator.serviceWorker.ready)
            .then(registration => {
                v.sw.ready = true;
                v.sw.file = file;
                v.sw.options = options;
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(navigator.serviceWorker);
                    }, 10);
                });
            })
            .catch(console.log);
    };

    v.sw.ready = false;
    v.sw.file = '/sw.js';
    v.sw.options = {scope: '/'};
}

if (v.is.node) {
    require('./valyrian.node.helpers.min.js')(v);
}

(v.is.node ? global : window).v = v;
