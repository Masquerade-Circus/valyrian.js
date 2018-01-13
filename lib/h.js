let h = function(...args) {
    var vnode = {
            name: 'div',
            props: {},
            children: []
        },
        l,
        i,
        attributes;

    if (typeof args[0] === 'string'){
        vnode.name = args.shift();
    }

    if (typeof args[0] === 'object' && !Array.isArray(args[0])){
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
        if (typeof args[i] === 'function'){
            vnode.children.push(args[i]());
            continue;
        }
        if(Array.isArray(args[i])){
            vnode.children.push.apply(vnode.children, args[i]);
            continue;
        }
        vnode.children.push(args[i]);
    }

    return vnode;
};

module.exports = h;
