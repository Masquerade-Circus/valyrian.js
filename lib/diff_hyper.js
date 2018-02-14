var lifecycle = [];

// node to vnode
var vnode = function(element) {
    if (element){
        return {
            name: element.nodeName.toLowerCase(),
            props: {},
            children: Array.prototype.map.call(element.childNodes, (element) => {
                return element.nodeType === 3
                  ? element.nodeValue
                  : vnode(element);
            })
        };
    }
};

var copy = function(a, b) {
    return Object.assign({},a,b);
};

var getKey = function(node) {
    return node && node.props ? node.props.key : null;
};

var setElementProp = function(element, name, value, isSVG, oldValue) {
    if (name === "key") {
        return;
    }

    if (name === "style") {
        for (var i in copy(oldValue, value)) {
            element[name][i] = value == null || value[i] == null ? "" : value[i];
        }
        return;
    }

    if (typeof value === "function" || (name in element && !isSVG)) {
        element[name] = value == null ? "" : value;
        return;
    }

    if (value != null && value !== false) {
        element.setAttribute(name, value);
        return;
    }

    if (value == null || value === false) {
        element.removeAttribute(name);
        return;
    }
};

var createElement = function(node, isSVG) {
    var name,
        i = 0,
        element = node && node.name
            ? (isSVG === true || node.name === "svg")
                ? document.createElementNS("http://www.w3.org/2000/svg", node.name)
                : document.createElement(node.name)
            : document.createTextNode(node);

    if (node){
        if (node.props) {
            if (node.props.oncreate) {
                lifecycle.push(function () {
                    node.props.oncreate(element);
                });
            }

            for (name in node.props) {
                setElementProp(element, name, node.props[name], isSVG);
            }
        }

        if (node.children.length){
            for (; i < node.children.length; i++) {
                element.appendChild(createElement(node.children[i], isSVG));
            }
        }
    }

    return element;
};

var updateElement = function(element, oldProps, props, isSVG) {
    var name;
    for (name in copy(oldProps, props)) {
        if (
          props[name] !==
          (name === "value" || name === "checked"
            ? element[name]
            : oldProps[name])
        ) {
            setElementProp(element, name, props[name], isSVG, oldProps[name]);
        }
    }

    if (props && props.onupdate) {
        lifecycle.push(function () {
            props.onupdate(element, oldProps, props);
        });
    }
};

var removeChildren = function(element, node, props) {
    if (node !== undefined){
        var props = node.props;
        if (props) {
            for (var i = 0; i < node.children.length; i++) {
                removeChildren(element.childNodes[i], node.children[i]);
            }

            if (props.ondestroy) {
                props.ondestroy(element);
            }
        }
    }
    return element;
};

var removeElement = function(parent, element, node) {
    var done = () => parent.removeChild(removeChildren(element, node));

    if (node.props && node.props.onremove){
        node.props.onremove(element, done);
        return;
    }

    done();
};

var patch = function(parent, element, oldNode, node, isSVG, nextSibling) {
    if (node == oldNode) { // If the node is the same do nothing

    } else if (oldNode == null) { // if old node does not exists create it
        element = parent.insertBefore(createElement(node, isSVG), element);
    } else if (node && node.name && node.name === oldNode.name) {
        updateElement(
            element,
            oldNode.props,
            node.props,
            (isSVG === true || node.name === "svg")
        );

        var oldElements = [],
            oldKeyed = {},
            newKeyed = {},
            i;

        for (i = 0; i < oldNode.children.length; i++) {
            oldElements[i] = element.childNodes[i];

            var oldChild = oldNode.children[i];
            var oldKey = getKey(oldChild);

            if (null != oldKey) {
                oldKeyed[oldKey] = [oldElements[i], oldChild];
            }
        }

        var i = 0;
        var j = 0;

        while (j < node.children.length) {
            var oldChild = oldNode.children[i];
            var newChild = node.children[j];

            var oldKey = getKey(oldChild);
            var newKey = getKey(newChild);

            if (newKeyed[oldKey]) {
                i++;
                continue;
            }

            if (newKey == null) {
                if (oldKey == null) {
                    patch(element, oldElements[i], oldChild, newChild, isSVG);
                    j++;
                }
                i++;
            } else {
                var recyledNode = oldKeyed[newKey] || [];

                if (oldKey === newKey) {
                    patch(element, recyledNode[0], recyledNode[1], newChild, isSVG);
                    i++;
                } else if (recyledNode[0]) {
                    patch(
                        element,
                        element.insertBefore(recyledNode[0], oldElements[i]),
                        recyledNode[1],
                        newChild,
                        isSVG
                    );
                } else {
                    patch(element, oldElements[i], null, newChild, isSVG);
                }

                j++;
                newKeyed[newKey] = newChild;
            }
        }

        while (i < oldNode.children.length) {
            var oldChild = oldNode.children[i];
            if (getKey(oldChild) == null) {
                removeElement(element, oldElements[i], oldChild);
            }
            i++;
        }

        for (var i in oldKeyed) {
            if (!newKeyed[oldKeyed[i][1].props.key]) {
                removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
            }
        }
    } else if (node.name === oldNode.name) {
        element.nodeValue = node;
    } else {
        element = parent.insertBefore(
            createElement(node, isSVG),
            (nextSibling = element)
        );
        removeElement(parent, nextSibling, oldNode);
    }
    return element;
};
