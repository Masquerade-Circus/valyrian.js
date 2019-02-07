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
v.addState = function (component, state) {
  Object.assign(component, { view: component }, state);
  return component;
};

v.utils = {
  flat: function (args, start, arr, notEmpty, l) {
    l = args.length;

    if (notEmpty === undefined) {
      notEmpty = false;
    }

    for (; start < l; start++) {
      if (Array.isArray(args[start])) {
        arr = v.utils.flat(args[start], 0, arr);
        continue;
      }
      if (notEmpty === false || (args[start] !== undefined && args[start] !== null)) {
        arr.push(args[start]);
      }
    }

    return arr;
  },
  dom2vnode($el, vnode) {
    if ($el.nodeType === 3) {
      return {
        name: '#text',
        isVnode: true,
        nodeValue: $el.nodeValue,
        children: [],
        dom: $el,
        nt: 3
      };
    }

    if ($el.nodeType === 1) {
      vnode = {
        name: $el.nodeName.toLowerCase(),
        props: {},
        children: [],
        dom: $el,
        isVnode: true,
        nodeValue: null,
        nt: 1
      };

      if (vnode.name === 'svg') {
        vnode.isSVG = true;
      }

      vnode.dom.events = {};

      Array.prototype.map.call($el.attributes, function (property) {
        vnode.props[property.nodeName] = property.nodeValue;
      });

      Array.prototype.forEach.call($el.childNodes, function ($el) {
        let childvnode = v.utils.dom2vnode($el);
        if (childvnode !== undefined) {
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

// TODO: This could not be working with undom for server side
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
