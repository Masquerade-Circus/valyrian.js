'use strict';
import Patch from './patch';

function v(tagOrComponent, props, vnode, i, children) {
  if (typeof tagOrComponent === 'string') {
    vnode = {
      name: tagOrComponent,
      props: {},
      children: [],
      dom: null,
      isVnode: true,
      nt: 1,
      isSVG: tagOrComponent === 'svg'
    };

    for (i in props) {
      vnode.props[i] = props[i];
    }

    v.utils.flat(arguments, 2, vnode.children, true);
    return vnode;
  }

  if (!tagOrComponent.view && typeof tagOrComponent === 'function') {
    tagOrComponent.view = tagOrComponent;
  }

  if (tagOrComponent.view) {
    children = tagOrComponent.view.apply(tagOrComponent, v.utils.flat(arguments, 1, []));
    return Array.isArray(children) ? children : [children];
  }
}

// This could be extended to do a deep clone
// This mutates the component
v.addState = function (component, state) {
  Object.assign(component, { view: component }, state);
};

v.utils = {
  flat: function (args, start, arr, notEmpty, l) {
    l = args.length;

    for (; start < l; start++) {
      if (Array.isArray(args[start])) {
        arr = v.utils.flat(args[start], 0, arr);
        continue;
      }
      if (!notEmpty || (args[start] !== undefined && args[start] !== null)) {
        arr.push(args[start]);
      }
    }

    return arr;
  },
  dom2vnode($el, vnode) {
    vnode = {
      props: {},
      children: [],
      dom: $el,
      isVnode: true,
      nodeValue: null,
      nt: $el.nodeType,
      isSVG: false
    };

    if (vnode.nt === 3) {
      vnode.name = '#text';
      vnode.nodeValue = $el.nodeValue;

      return vnode;
    }

    if (vnode.nt === 1) {
      vnode.name = $el.nodeName.toLowerCase();

      if (vnode.name === 'svg') {
        vnode.isSVG = true;
      }

      vnode.dom.events = {};

      Array.prototype.map.call($el.attributes, function (property) {
        vnode.props[property.nodeName] = property.nodeValue;
      });

      Array.prototype.forEach.call($el.childNodes, function ($el) {
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
