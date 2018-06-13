let h = function (...args) {
    let vnode = {
            name: '',
            props: {},
            children: []
        },
        l,
        i,
        attributes;

    if (typeof args[0] === 'string' && args[0].trim().length > 0) {
        vnode.name = args.shift();
    }

    if (vnode.name === 'textNode') {
        vnode.value = args.join(' ').trim();
        return vnode;
    }

    if (!h.isVnode(args[0]) && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
        vnode.props = args.shift();
    }

    if (/(\.|\[|#)/gi.test(vnode.name)) {
        attributes = vnode.name.match(/([\.\#][\w-]+|\[[^\]]+\])/gi);
        vnode.name = vnode.name.replace(/([\.\#][\w-]+|\[[^\]]+\])/gi, '');
        if (attributes) {
            for (l = attributes.length; l--;) {
                if (attributes[l].charAt(0) === '#') {
                    vnode.props.id = attributes[l].slice(1).trim();
                    continue;
                }

                if (attributes[l].charAt(0) === '.') {
                    vnode.props.class = ((vnode.props.class || '') + ' ' + attributes[l].slice(1)).trim();
                    continue;
                }

                if (attributes[l].charAt(0) === '[') {
                    attributes[l] = attributes[l].trim().slice(1, -1).split('=');
                    vnode.props[attributes[l][0]] = (attributes[l][1] || 'true').replace(/^["'](.*)["']$/gi, '$1');
                }
            }
        }
    }

    let nodes = h.flatenArray(args);

    for (i = 0, l = nodes.length; i < l; i++) {
        vnode.children.push(h.isVnode(nodes[i]) ? nodes[i] : h('textNode', nodes[i]));
    }

    vnode.name = vnode.name.trim() === '' ? 'div' : vnode.name.trim();

    return vnode;
};

h.flatenArray = function (nodes, array = []) {
    if (!Array.isArray(nodes)) {
        array.push(nodes);
        return array;
    }

    let i = 0, l = nodes.length;
    for (; i < l; i++) {
        if (Array.isArray(nodes[i])) {
            h.flatenArray(nodes[i], array);
        }

        if (!Array.isArray(nodes[i])) {
            array.push(nodes[i]);
        }
    }

    return array;
};

h.isVnode = function (vnode) {
    return vnode && vnode.name && vnode.props && vnode.children;
};

h.vnode = function ($el) {
    let obj = {
        name: '',
        props: {},
        children: [],
        dom: $el
    };

    if ($el) {
        if ($el.nodeType === 3) {
            obj.value = $el.nodeValue;
            obj.name = 'textNode';
        }

        if ($el.nodeType !== 3) {
            Array.prototype.map.call($el.attributes, property => {
                obj.props[property.nodeName] = property.nodeValue;
            });
            obj.name = $el.nodeName.toLowerCase();
            obj.children = Array.prototype.map.call($el.childNodes, $el => h.vnode($el));
        }
    }

    return obj;
};

export default h;
