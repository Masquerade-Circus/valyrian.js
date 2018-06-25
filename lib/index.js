import RouterFactory from './router';
import h from './h';
import Request from './request';
import patchFactory from './patch';

function isComponent(component) {
    return typeof component === 'object' &&
        component !== null &&
        typeof component.view === 'function';
};

function render(component, args) {
    return h.flatenArray(component.view.apply(component, args));
};

function v(...args) {
    if (isComponent(args[0])) {
        return render(args.shift(), args);
    }

    if (typeof args[0] === 'function') {
        let component = {view: args.shift()};
        args.forEach(item => Object.assign(component, item));
        return component;
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

v.mount = function (elementContainer, ...args) {
    if (elementContainer === undefined) {
        throw new Error('v.domorselector.required');
        return;
    }

    if (!isComponent(args[0])) {
        throw new Error('v.component.required');
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

    return v.update.apply(v, args);
};

function redraw(component, args) {
    if (isComponent(component)) {
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

        rootTree.children = render(rootComponent, args);

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

v.update = function (...args) {
    return v.is.browser
        ? requestAnimationFrame(() => redraw(args.shift(), args))
        : redraw(args.shift(), args);
};

function runRoute(parentComponent, url, args) {
    return mainRouter(url)
        .then(response => {
            if (!isComponent(response)) {
                throw new Error('v.router.component.required');
                return;
            }

            if (parentComponent) {
                args.unshift(render(response, args));
                response = parentComponent;
            }

            args.unshift(response);

            if (v.is.node || !v.is.mounted) {
                args.unshift(RoutesContainer);
                return v.mount.apply(v, args);
            }

            return v.update.apply(v, args);
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

v.routes.go = function (...args) {
    let parentComponent;
    let url;

    if (isComponent(args[0])) {
        parentComponent = args.shift();
    }

    if (typeof args[0] === 'string') {
        url = args.shift();
    }

    if (!url) {
        throw new Error('v.router.url.required');
    }

    if (v.is.browser) {
        window.history.pushState({}, '', url);
    }

    return runRoute(parentComponent, url, args);
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
            });
    };

    v.sw.ready = false;
    v.sw.file = '/sw.js';
    v.sw.options = {scope: '/'};
}

if (v.is.node) {
    require('./valyrian.node.helpers.min.js')(v);
}

(v.is.node ? global : window).v = v;
