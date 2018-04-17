let PatchFactory = function (v) {
    let document = v.document;

    function setProp($target, name, value) {
        if (name === 'className') {
            $target.setAttribute('class', value);
            return;
        }

        if (typeof value === 'function') {
            $target[name] = value.bind($target);
            return;
        }

        if (typeof value === 'boolean') {
            $target[name] = value;
        }

        if (value !== undefined && value !== false) {
            $target.setAttribute(name, value);
        } else {
            $target.removeAttribute(name);
        }
    }

    function updateProps(newNode, oldNode = {}) {
        // const props = Object.assign({}, newProps, oldProps);
        var newProps = newNode.props,
            oldProps = oldNode.props || {};

        const props = Object.assign(
            {},
            newProps,
            oldProps
        );
        for (let name in props) {
            if (newProps[name] !== oldProps[name]) {
                setProp(newNode.dom, name, newProps[name]);
            }
        }
    }

    function lifecycleCall(vnode, methodName, ...args) {
        if (v.isVnode(vnode)) {
            let method = vnode.props[methodName];
            if (method && method.call) {
                args.unshift(vnode);
                return method.apply(vnode, args);
            }
        }
    }

    function createElement(vnode) {
        var $el;
        delete vnode.dom;
        lifecycleCall(vnode, 'oninit');
        $el = vnode.name === 'textNode' ?
            document.createTextNode(vnode.value) :
            vnode.name === "svg" ?
                document.createElementNS("http://www.w3.org/2000/svg", vnode.name) :
                document.createElement(vnode.name);

        vnode.dom = $el;
        updateProps(vnode);

        for (let i = 0; i < vnode.children.length; i++) {
            $el.appendChild(createElement(vnode.children[i]));
        }

        lifecycleCall(vnode, 'oncreate');
        return $el;
    }

    function removeElement(oldNode, destroyed = false) {
        return Promise.resolve(lifecycleCall(oldNode, 'onbeforeremove'))
            .then(() => {
                if (!destroyed && oldNode.dom && oldNode.dom.parentElement) {
                    oldNode.dom.parentElement.removeChild(oldNode.dom);
                }

                let i = 0, l = oldNode.children.length;
                for (; i < l; i++) {
                    removeElement(oldNode.children[i], destroyed);
                }

                lifecycleCall(oldNode, 'onremove');
            });
    }

    function patch($parent, newNode, oldNode) {
        // console.log(0, $parent, newNode, oldNode);

        // New node
        if (oldNode === undefined && newNode !== undefined) {
            // console.log(2, newNode);
            $parent.appendChild(createElement(newNode));
            return $parent;
        }

        // Deleted node
        if (newNode === undefined) {
            // console.log(3, oldNode);
            removeElement(oldNode);
            return $parent;
        }

        if (v.isVnode(oldNode) && v.isVnode(newNode)) {
            newNode.dom = oldNode.dom;

            // Same node
            if (newNode.name === 'textNode' && oldNode.value == newNode.value) {
                // console.log(1, newNode, oldNode);
                return $parent;
            }

            // New node replacing old node
            if (
                (newNode.name === 'textNode' && newNode.value != oldNode.value) ||
                newNode.name !== oldNode.name
            ) {
                // console.log(4, $parent, newNode, oldNode);
                createElement(newNode);
                Promise.resolve(removeElement(oldNode, true))
                    .then(() => {
                        $parent.replaceChild(newNode.dom, oldNode.dom);
                    });
                return $parent;
            }

            // Same node updated
            // console.log(5, newNode, oldNode);
            // if (lifecycleCall(newNode, 'onbeforeupdate', oldNode) === false){
            //     return $parent;
            // }

            if (!v.isMounted) {
                lifecycleCall(newNode, 'oninit');
                lifecycleCall(newNode, 'oncreate');
            }

            updateProps(newNode, oldNode);

            const max = Math.max(newNode.children.length, oldNode.children.length);
            for (let i = 0; i < max; i++) {
                patch(
                    newNode.dom,
                    newNode.children[i],
                    oldNode.children[i]
                );
            }

            lifecycleCall(newNode, 'onupdate');
            return $parent;
        }

        // console.log(6, newNode, oldNode);

        return $parent;
    };

    return patch;
};

export default PatchFactory;
