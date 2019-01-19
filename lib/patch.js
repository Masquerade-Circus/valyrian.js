
let plugin = function (v) {
    let mountedComponent;
    let oldTree;
    let newTree;
    let mainContainer;

    function lifecycleCall(vnode, methodName, oldNode, i, l) {
        if (vnode.nt === 1) {
            if (vnode.props[methodName] !== undefined) {
                vnode.props[methodName](vnode, oldNode);
            }

            if (methodName === 'onremove') {
                i = 0;
                l = vnode.children.length;
                for (; i < l; i++) {
                    lifecycleCall(vnode.children[i], 'onremove');
                }
                vnode.children = [];
            }
        }
    }

    function eventListener(e) {
        if (e.currentTarget.events['on' + e.type] !== undefined) {
            e.currentTarget.events['on' + e.type](e);
        }
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

            if (newNode === undefined) { // Removed
                if (oldNode !== undefined) {
                    if (oldNode.nt === 3) {
                        lifecycleCall(oldNode, 'onremove');
                    }
                    $parent.removeChild(oldNode.dom);
                }
                continue;
            }

            if (newNode.nt === undefined || newNode.nt === 3) { // Is text
                if (newNode.nt === undefined) {
                    newTree[i] = newNode = {
                        name: '#text',
                        isVnode: true,
                        nodeValue: newNode,
                        children: [],
                        nt: 3
                    };
                }

                if (oldNode === undefined) {
                    newNode.dom = document.createTextNode(newNode.nodeValue);
                    $parent.appendChild(newNode.dom);
                } else { // Replaced
                    if (oldNode.nt === 1) {
                        newNode.dom = document.createTextNode(newNode.nodeValue);
                        lifecycleCall(oldNode, 'onremove');
                        $parent.replaceChild(newNode.dom, oldNode.dom);
                    } else {
                        newNode.dom = oldNode.dom;
                        if (newNode.nodeValue != oldNode.nodeValue) {
                            newNode.dom.nodeValue = newNode.nodeValue;
                        }
                    }
                }

                continue;
            }

            isNew = !v.is.mounted;

            isSVG = isSVG || newNode.isSVG;

            if (oldNode === undefined) { // Added
                lifecycleCall(newNode, 'oninit');
                newNode.dom = isSVG ?
                    document.createElementNS("http://www.w3.org/2000/svg", newNode.name) :
                    document.createElement(newNode.name);
                newNode.dom.events = {};
                $parent.appendChild(newNode.dom);
                oldNode = {children: []};
                isNew = true;
            } else {
                if (newNode.name !== oldNode.name) { // Replaced
                    lifecycleCall(newNode, 'oninit');
                    newNode.dom = isSVG ?
                        document.createElementNS("http://www.w3.org/2000/svg", newNode.name) :
                        document.createElement(newNode.name);
                    newNode.dom.events = {};

                    lifecycleCall(oldNode, 'onremove');
                    $parent.replaceChild(newNode.dom, oldNode.dom);
                    isNew = true;
                } else { // Updated
                    newNode.dom = oldNode.dom;
                    for (name in oldNode.props) {
                        if (newNode.props[name] === undefined) {
                            if (typeof oldNode.props[name] === 'function') {
                                newNode.dom.removeEventListener(name.slice(2), eventListener);
                                continue;
                            }

                            if (v.is.node || isSVG || newNode.dom[name] === undefined) {
                                newNode.dom.removeAttribute(name);
                                continue;
                            }

                            newNode.dom[name] = null;
                        }
                    }
                }
            }

            patch(newNode.dom, newNode.children, oldNode.children, isSVG);

            // Update props
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

            if (!v.is.mounted && !isNew) {
                lifecycleCall(newNode, 'oninit');
                lifecycleCall(newNode, 'oncreate');
            }

            lifecycleCall(newNode, isNew ? 'oncreate' : 'onupdate', oldNode);
        }
    }


    v.update = function (args) {
        args = v.utils.flat(arguments, 0, []);
        if (typeof args[0] === 'object') {
            if (typeof args[0].isComponent === 'undefined' && typeof args[0].view === 'function') {
                mountedComponent = Object.assign(args.shift(), {isComponent: true});
            } else if (args[0].isComponent) {
                mountedComponent = args.shift();
            }
        }

        return new Promise(function update(resolve) {
            if (!v.is.updating) {
                v.is.updating = true;
                args.unshift(mountedComponent);
                newTree = v.apply(v, args);
                patch(mainContainer, newTree, oldTree);
                oldTree = newTree;
                v.is.updating = false;
                v.is.mounted = true;
                if (v.is.node) {
                    return resolve(mainContainer.innerHTML);
                }
                resolve();
            }
        });
    };

    v.mount = function (container) {
        mainContainer = v.is.node
            ? document.createElement('div')
            : typeof container === 'string'
                ? document.querySelectorAll(container)[0]
                : container;

        oldTree = v.utils.dom2vnode(mainContainer).children;

        return v.update.apply(this, v.utils.flat(arguments, 1, []));
    };
};

export default plugin;
