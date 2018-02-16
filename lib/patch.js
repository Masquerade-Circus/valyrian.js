let PatchFactory = function(v,window){
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
        for (let name in props){
            if (newProps[name] !== oldProps[name]) {
                setProp(newNode.dom, name, newProps[name]);
            }
        }
    }

    function lifecycleCall(vnode, methodName, ...args){
        if (v.isVnode(vnode)){
            method = vnode.props[methodName];
            if (method && method.call){
                args.unshift(vnode);
                return method.apply(vnode, args);
            }
        }
    }

    function createElement(vnode) {
        var $el;
        if (v.isVnode(vnode)){
            delete vnode.dom;
            lifecycleCall(vnode, 'oninit');
            $el = vnode.name === "svg" ?
                document.createElementNS("http://www.w3.org/2000/svg", vnode.name) :
                document.createElement(vnode.name);

            vnode.dom = $el;
            updateProps(vnode);

            for (let i = 0; i < vnode.children.length; i++){
                $el.appendChild(createElement(vnode.children[i]));
            }

            lifecycleCall(vnode, 'oncreate');
            return $el;
        }

        return document.createTextNode(vnode);
    }

    // function removeElement(oldNode, $parent, index){
    //     if (v.isVnode(oldNode)){
    //         let i = 0, l = oldNode.children.length;
    //         for (;i<l;i++){
    //             removeElement(oldNode.children[i], oldNode.dom, i);
    //         }
    //     }
    //
    //     if ($parent){
    //         $parent.removeChild($parent.childNodes[index]);
    //     }
    //
    //     lifecycleCall(oldNode, 'onremove');
    // }

    function removeElement(oldNode){
        if (v.isVnode(oldNode)){
            let i = 0, l = oldNode.children.length;
            for (;i<l;i++){
                removeElement(oldNode.children[i]);
            }
        }

        if (oldNode.dom && oldNode.dom.parentElement){
            oldNode.dom.parentElement.removeChild(oldNode.dom);
        }

        lifecycleCall(oldNode, 'onremove');
    }

    function patch($parent, newNode, oldNode, index = 0) {
        // console.log(0, $parent, newNode, oldNode, index);
        if (v.isVnode(oldNode) && v.isVnode(newNode)){
            newNode.dom = oldNode.dom;
        }

        if (oldNode == newNode){
            // console.log(1, newNode, oldNode);

            return $parent;
        }

        if (oldNode === undefined) {
            // console.log(2, newNode);
            $parent.appendChild(createElement(newNode));
            return $parent;
        }

        if (newNode === undefined) {
            // console.log(3, oldNode);
            removeElement(oldNode);
            return $parent;
        }

        if (
            typeof newNode !== typeof oldNode ||
            ((typeof newNode === 'string' || typeof newNode === 'number') && newNode != oldNode) ||
            newNode.name !== oldNode.name
        ) {
            // console.log(4, index, $parent, $parent.childNodes, $parent.childNodes[index], newNode, oldNode);
            console.log(newNode, oldNode);
            // $parent.insertBefore(createElement(newNode), $parent.childNodes[index]);
            $parent.replaceChild(createElement(newNode),$parent.childNodes[index]);
            // $parent.replaceChild(createElement(newNode),oldNode.dom);
            return $parent;
        }

        if (v.isVnode(newNode)) {
            // console.log(5, newNode, oldNode);
            if (lifecycleCall(newNode, 'onbeforeupdate', oldNode) === false){
                return $parent;
            }

            updateProps(
              newNode,
              oldNode
            );

            const max = Math.max(newNode.children.length,oldNode.children.length);
            for (let i = 0; i < max; i++) {
                patch(
                  $parent.childNodes[index],
                  newNode.children[i],
                  oldNode.children[i],
                  i
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

module.exports = PatchFactory;
