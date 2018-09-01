'use strict';

function createVnode() {
    return {
        name: 'div',
        props: {},
        children: [],
        dom: null,
        isVnode: true,
        isText: false,
        nodeValue: null
    };
}

function dom2vnode($el, vnode) {
    if ($el.nodeType === 3 || $el.nodeType === 1) {
        vnode = createVnode();
        vnode.name = $el.nodeName.toLowerCase();
        vnode.dom = $el;

        if ($el.nodeType === 3) {
            vnode.nodeValue = $el.nodeValue;
            vnode.isText = true;
            return vnode;
        }

        vnode.dom.events = {};

        Array.prototype.map.call($el.attributes, function (property) {
            vnode.props[property.nodeName] = property.nodeValue;
        });

        Array.prototype.forEach.call($el.childNodes, function ($el) {
            let childvnode = dom2vnode($el);
            if (childvnode !== undefined) {
                vnode.children.push(childvnode);
            }
        });

        return vnode;
    }
}

function getChildren(args, array, index, length, vnode) {
    index = 0;
    length = args.length;

    for (; index < length; index++) {
        if (args[index]) {
            if (Array.isArray(args[index])) {
                getChildren(args[index], array);
                continue;
            }

            if (typeof args[index] === 'object' && (args[index].isVnode)) {
                array.push(args[index]);
                continue;
            }

            vnode = createVnode();
            vnode.name = '#text';
            vnode.isText = true;
            vnode.nodeValue = args[index];

            array.push(vnode);
        }
    }
}

function v(tagOrComponent, props, vnode, i, children) {
    if (typeof tagOrComponent === 'string') {
        vnode = createVnode();
        vnode.name = tagOrComponent;

        for (i in props) {
            vnode.props[i] = props[i];
        }

        getChildren(v.utils.flat(arguments, 2), vnode.children);
        return vnode;
    }

    if (typeof tagOrComponent === 'function') {
        return Object.assign({view: tagOrComponent, isComponent: true}, props);
    }

    if (typeof tagOrComponent === 'object') {
        if (typeof tagOrComponent.view === 'function') {
            Object.assign(tagOrComponent, {isComponent: true});
        }

        if (tagOrComponent.isComponent) {
            children = tagOrComponent.view.apply(tagOrComponent, v.utils.flat(arguments, 1));
            return Array.isArray(children) ? children : [children];
        }
    }
}

v.utils = {};
v.utils.flat = function (args, start, arr, l) {
    if (arr === undefined) {
        arr = [];
    }

    l = args.length;

    if (start === undefined) {
        start = 0;
    }

    for (; start < l; start++) {
        if (Array.isArray(args[start])) {
            arr = v.utils.flat(args[start], 0, arr);
            continue;
        }
        arr.push(args[start]);
    }

    return arr;
};

v.is = {};
v.is.node = typeof window === 'undefined';
v.is.browser = !v.is.node;
v.is.mounted = false;

v.trust = function (htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    return Array.prototype.map.call(div.childNodes, (item) => dom2vnode(item));
};

let mountedComponent;
let oldTree;
let newTree;
let mainContainer;

function lifecycleCall(vnode, methodName) {
    if (
        !vnode.isText &&
            vnode.props !== undefined &&
            vnode.props[methodName] !== undefined
    ) {
        return vnode.props[methodName](vnode);
    }
}

function eventListener(e) {
    e.currentTarget.events['on' + event.type](e);
    v.update();
}

function patch($parent, newTree, oldTree, isSVG, max, newNode, oldNode, i, isNew, name) {
    if (newTree.length === 0) {
        $parent.textContent = '';
        return;
    }

    max = newTree.length > oldTree.length ? newTree.length : oldTree.length;
    i = 0;
    for (; i < max; i++) {
        newNode = newTree[i];
        oldNode = oldTree[i];
        isNew = !v.is.mounted;

        if (newNode === undefined) { // Removed
            lifecycleCall(oldNode, 'onremove');
            $parent.removeChild(oldNode.dom);
            continue;
        }

        isSVG = isSVG || newNode.name === 'svg';

        if (oldNode === undefined) { // Added
            lifecycleCall(newNode, 'oninit');
            newNode.dom = newNode.isText ?
                document.createTextNode(newNode.nodeValue) :
                isSVG ?
                    document.createElementNS("http://www.w3.org/2000/svg", newNode.name) :
                    document.createElement(newNode.name);
            $parent.appendChild(newNode.dom);
            if (newNode.isText) {
                continue;
            }
            oldNode = {children: []};
            isNew = true;
        } else {
            if (newNode.name !== oldNode.name) { // Replaced
                lifecycleCall(newNode, 'oninit');
                newNode.dom = newNode.isText ?
                    document.createTextNode(newNode.nodeValue) :
                    isSVG ?
                        document.createElementNS("http://www.w3.org/2000/svg", newNode.name) :
                        document.createElement(newNode.name);

                lifecycleCall(oldNode, 'onremove');
                $parent.replaceChild(newNode.dom, oldNode.dom);
                if (newNode.isText) {
                    continue;
                }
                isNew = true;
            } else { // Updated
                newNode.dom = oldNode.dom;
                if (newNode.isText) {
                    newNode.dom.nodeValue = newNode.nodeValue;
                    continue;
                }
            }
        }

        patch(newNode.dom, newNode.children, oldNode.children, isSVG);

        // Update props
        if (!isNew) {
            for (name in oldNode.props) {
                if (newNode.props[name] === undefined) {
                    if (typeof oldNode.props[name] === 'function') {
                        newNode.dom.removeEventListener(name.slice(2), eventListener);
                        continue;
                    }
                    newNode.dom[name] = null;
                    if (v.is.node) {
                        newNode.dom.removeAttribute(name);
                    }
                }
            }
        }

        for (name in newNode.props) {
            if (
                (
                    isNew ||
                    (newNode.props[name] !== oldNode.props[name])
                ) &&
                newNode.props[name] !== undefined
            ) {
                if (typeof newNode.props[name] === 'function') {
                    switch (name) {
                        case 'oninit':
                        case 'oncreate':
                        case 'onupdate':
                        case 'onremove':
                            break;
                        default:
                            if (newNode.dom.events === undefined) {
                                newNode.dom.events = {};
                            }

                            if (newNode.dom.events[name] === undefined) {
                                newNode.dom.events[name] = newNode.props[name];
                                newNode.dom.addEventListener(name.slice(2), eventListener);
                            }
                            break;
                    }

                    continue;
                }

                if (v.is.node || isSVG || newNode.dom[name] === undefined) {
                    newNode.dom.setAttribute(name, newNode.props[name]);
                    continue;
                }

                newNode.dom[name] = newNode.props[name];
            }
        }

        if (!v.is.mounted) {
            lifecycleCall(newNode, 'oninit');
            lifecycleCall(newNode, 'oncreate');
        }

        lifecycleCall(newNode, isNew ? 'oncreate' : 'onupdate');
    }
}

let isUpdating = false;

v.update = function (args) {
    args = v.utils.flat(arguments);
    if (typeof args[0] === 'object' && args[0].isComponent) {
        mountedComponent = args.shift();
    }
    return new Promise((resolve) => {
        if (!isUpdating) {
            isUpdating = true;
            args.unshift(mountedComponent);
            newTree = v.apply(v, args);
            patch(mainContainer, newTree, oldTree);
            oldTree = newTree;
            isUpdating = false;
            v.is.mounted = true;
            resolve(mainContainer.innerHTML);
        }
    });
};

v.mount = function (container, component) {
    mountedComponent = component;
    mainContainer = v.is.node ? document.createElement('div') : typeof container === 'string' ? document.querySelectorAll(container)[0] : container;
    oldTree = dom2vnode(mainContainer).children;
    return v.update.apply(this, v.utils.flat(arguments, 2));
};

// Very simple plugin system
let plugins = [];
v.use = function (plugin, options) {
    if (plugins.indexOf(plugin) === -1) {
        plugin(v, options);
        plugins.push(plugin);
    }
    return v;
};

(v.is.node ? global : window).v = v;
