import h from './h';

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
        let newProps = newNode.props,
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

    function lifecycleCall(vnode, methodName) {
        return vnode.props && vnode.props[methodName] && vnode.props[methodName](vnode);
    }

    function createElement(vnode) {
        let $el;
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

        // New node
        if (oldNode === undefined && newNode !== undefined) {
            $parent.appendChild(createElement(newNode));
        }

        // Deleted node
        if (newNode === undefined) {
            removeElement(oldNode);
        }

        if (h.isVnode(oldNode) && h.isVnode(newNode)) {
            newNode.dom = oldNode.dom;

            // Same node
            if (newNode.name === 'textNode' && oldNode.value == newNode.value) {
                return $parent;
            }

            // New node replacing old node
            if (
                (newNode.name === 'textNode' && newNode.value != oldNode.value) ||
                newNode.name !== oldNode.name
            ) {
                createElement(newNode);
                Promise.resolve(removeElement(oldNode, true))
                    .then(() => {
                        $parent.replaceChild(newNode.dom, oldNode.dom);
                    });
                return $parent;
            }

            // if (!v.isMounted) {
            //     lifecycleCall(newNode, 'oninit');
            //     lifecycleCall(newNode, 'oncreate');
            // }

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
        }

        return $parent;
    };

    return patch;
};

export default PatchFactory;
