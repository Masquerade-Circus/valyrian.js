import Router from './router';
import h from './h';
import S from './s';
import Request from './request';
import Patch from './patch';

let VFactory = function () {

    let v = function (...args) {
        if (v.isComponent(args[0])) {
            return v.render.apply(v, args);
        }

        return h.apply(h, args);
    };

    v.r = Request();

    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach(method =>
        v[method] = (url, data, options) => v.r.request(method, url, data, options)
    );

    v.router = Router(v);

    v.isVnode = h.isVnode;
    v.vnode = h.vnode;

    v.isNode = typeof window === 'undefined';

    v.window = v.isNode ? require('html-element') : window;
    v.document = v.window.document;

    var patch = Patch(v);

    v.clock = function (start) {
        let end, p = typeof performance !== 'undefined' ? performance : process;
        if (p !== undefined && p.hrtime !== undefined) {
            if (!start) {
                return process.hrtime();
            };
            end = process.hrtime(start);
            return Math.round((end[0] * 1000) + (end[1] / 1000000));
        }

        if (p !== undefined && p.now !== undefined) {
            if (!start) {
                return performance.now();
            }

            end = performance.now();
            return end - start;
        }
    };

    v.getFixedFrameRateMethod = function (fps = 5, callback, scope) {
        let time,
            previousTime = v.clock(),
            method = function () {
                time = v.clock();
                if (v.clock(previousTime) > 1000 / fps) {
                    previousTime = time;
                    if (typeof callback === 'function') {
                        if (typeof requestAnimationFrame === 'function') {
                            requestAnimationFrame(callback.bind(scope || this));
                        } else {
                            setTimeout(callback.bind(scope || this), 1);
                        }
                    }
                }
            };

        return method;
    };

    v.resetToDefaults = function () {
        v.isMounted = false;
        v.container = v.document.createElement('html');
        v.parent = v.document.createElement('div');
        v.parent.appendChild(v.container);
        v.rootTree = v.vnode(v.container);
        v.oldTree = Object.assign({}, v.rootTree);
    };
    v.resetToDefaults();
    // console.log(v.rootTree);

    v.rootComponent = undefined;

    v.assignAttributes = function (component, attributes = {}) {
        if (attributes.name && attributes.props && Array.isArray(attributes.children)) {
            component.attributes = { children: attributes };
        } else {
            component.attributes = Object.assign({}, component.attributes, attributes);
        }
    };

    v.parseNodes = function (nodes, array = []) {
        if (!Array.isArray(nodes)) {
            array.push(nodes);
            return array;
        }

        let i = 0, l = nodes.length;
        for (; i < l; i++) {
            if (Array.isArray(nodes[i])) {
                v.parseNodes(nodes[i], array);
            }

            if (!Array.isArray(nodes[i])) {
                array.push(nodes[i]);
            }
        }
        return array;
    };

    v.render = function (component, attributes = {}) {
        var nodes;
        if (!v.isComponent(component)) {
            throw new Error('A component is required');
            return;
        }

        v.assignAttributes(component, attributes);

        nodes = v.parseNodes(component.view());

        return nodes;
    };

    v.mount = function (container, component, attributes = {}) {
        if (container === undefined) {
            throw new Error('A container element is required as first element');
            return;
        }

        if (!v.isComponent(component)) {
            throw new Error('A component is required as a second argument');
            return;
        }

        v.container = container;
        v.rootTree = v.vnode(v.container);
        v.oldTree = Object.assign({}, v.rootTree);

        return v.update(component, attributes);
    };

    v.update = function (component, attributes = {}) {
        if (v.isComponent(component)) {
            v.assignAttributes(component, attributes);
            v.rootComponent = component;
            v.rootTree.props = Object.assign({}, v.rootTree.props, v.rootComponent);
            Object.keys(v.rootComponent).forEach(prop => {
                if (typeof prop === 'function') {
                    v.rootTree.props.bind(v.rootComponent);
                }
            });
        };

        if (v.isNode) {
            v.resetToDefaults();
        }

        v.rootTree.children = v.render(v.rootComponent);

        // console.log('******************************');
        patch(v.rootTree.dom.parentElement, v.rootTree, v.oldTree);
        // console.log('******************************');

        v.oldTree = Object.assign({}, v.rootTree);

        if (!v.isMounted) {
            v.isMounted = true;
        }
        return v.isNode ? v.rootTree.dom.parentElement.innerHTML : v.rootTree.dom.parentElement;
    };

    v.isComponent = function (component) {
        return typeof component === 'object' &&
            component !== null &&
            typeof component.view === 'function';
    };

    var s = S(v);

    v.data = function (...args) {
        return s.storeData.apply(s, args);
    };

    v.onStoreUpdate = function (...args) {
        return s.onStoreUpdate.apply(s, args);
    };

    v.onStoreUpdate(function () {
        v.update();
    });

    return v;
};

(typeof window === 'undefined'
    ? global
    : window).Valyrian = VFactory;

