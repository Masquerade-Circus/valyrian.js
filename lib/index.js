'use strict';

import Patch from './patch';

let und;
let isArray = Array.isArray;
let forEach = Array.prototype.forEach;

function v(tagOrComponent, props, vnode, children, i) {
  if (typeof tagOrComponent === 'string') {
    vnode = {
      name: tagOrComponent,
      props: props || {},
      children: [],
      el: true,
      isSVG: tagOrComponent === 'svg'
    };

    v.utils.flat(arguments, 2, vnode.children, true);
    return vnode;
  }

  if (!tagOrComponent.view && typeof tagOrComponent === 'function') {
    tagOrComponent.view = tagOrComponent;
  }

  if (tagOrComponent.view) {
    children = tagOrComponent.view.apply(tagOrComponent, v.utils.flat(arguments, 1, []));
    return v.utils.flat(isArray(children) ? children : [children], 0, [], true);
  }
}

// This could be extended to do a deep clone
// This mutates the component
v.addState = function (component, state) {
  Object.assign(component, { view: component }, state);
};

v.utils = {
  flat(args, start, arr, convertToVnode, l, next) {
    l = args.length;

    for (; start < l; start++) {
      next = args[start];
      if (isArray(next)) {
        arr = v.utils.flat(next, 0, arr, convertToVnode);
      } else if (next !== und && next !== null) {
        if (convertToVnode === true && next.el === und) {
          next = {
            props: {},
            nodeValue: String(next),
            children: [],
            el: false
          };
        }
        arr.push(next);
      }
    }

    return arr;
  },
  dom2vnode($el, vnode, nt) {
    nt = $el.nodeType;
    if (nt === 3 || nt === 1) {
      vnode = {
        props: {},
        children: [],
        dom: $el,
        el: true,
        isSVG: false
      };

      if (nt === 3) {
        vnode.nodeValue = $el.nodeValue;
        vnode.el = false;
        return vnode;
      }

      vnode.name = $el.nodeName.toLowerCase();
      vnode.isSVG = vnode.name === 'svg';

      vnode.dom.events = {};

      forEach.call($el.attributes, property => vnode.props[property.nodeName] = property.nodeValue);

      forEach.call($el.childNodes, ($el) => {
        let childvnode = v.utils.dom2vnode($el);
        if (childvnode) {
          vnode.children.push(childvnode);
        }
      });

      return vnode;
    }
  }
};

v.is = {
  node: typeof window === 'undefined',
  mounted: false,
  updating: false
};
v.is.browser = !v.is.node;

// NOTE: This does not work with undom for server side rendering
// See: https://github.com/developit/undom/issues/7
v.trust = function (htmlString) {
  let div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  return Array.prototype.map.call(div.childNodes, (item) => v.utils.dom2vnode(item));
};

let plugins = [];
v.use = function (plugin, options) {
  if (plugins.indexOf(plugin) === -1) {
    plugin(v, options);
    plugins.push(plugin);
  }
  return v;
};

v.use(Patch);


(v.is.node ? global : window).v = v;
