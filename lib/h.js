let h = function(...args) {
    var vnode = {
            name: 'div',
            props: {},
            children: []
        },
        l,
        i,
        attributes,
        children;

    if (typeof args[0] === 'string' && args[0].trim().length > 0){
        vnode.name = args.shift();
    }

    if (!h.isVnode(args[0]) && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null){
        vnode.props = args.shift();
    }

    if(/(\.|\[|#)/gi.test(vnode.name)){
        attributes = vnode.name.match(/([\.|\#]\w+|\[[^\]]+\])/gi);
        vnode.name = vnode.name.replace(/([\.|\#]\w+|\[[^\]]+\])/gi, '');
        if (attributes){
            for(l = attributes.length; l--;){
                if (attributes[l].charAt(0) === '#'){
                    vnode.props.id = attributes[l].slice(1);
                    continue;
                }

                if (attributes[l].charAt(0) === '.'){
                    vnode.props.class = ((vnode.props.class || '') + ' ' + attributes[l].slice(1)).trim();
                    continue;
                }

                if (attributes[l].charAt(0) === '['){
                    attributes[l] = attributes[l].trim().slice(1,-1).split('=');
                    vnode.props[attributes[l][0]] = attributes[l][1];
                }
            }
        }
    }

    for (i = 0, l = args.length; i<l; i++){
        if(Array.isArray(args[i])){
            for (var k = 0, kl = args[i].length; k < kl; k++){
                vnode.children.push(typeof args[i][k] === 'undefined' ? 'undefined' : args[i][k]);
            }
            // vnode.children.push.apply(vnode.children, args[i]);
            continue;
        }

        vnode.children.push(typeof args[i] === 'undefined' ? 'undefined' : args[i]);
    }

    return vnode;
};

h.isVnode = function(vnode){
    return vnode && vnode.name && vnode.props && vnode.children;
};

h.vnode = function(element) {
    if (element){
        return {
            name: element.nodeName.toLowerCase(),
            props: {},
            children: Array.prototype.map.call(element.childNodes, (element) => {
                return element.nodeType === 3
                  ? element.nodeValue
                  : h.vnode(element);
            }),
            dom: element
        };
    }
};

module.exports = h;