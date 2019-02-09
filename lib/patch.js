let plugin = function (v) {
  let mountedComponent;
  let oldTree;
  let newTree;
  let mainContainer;
  let und;
  let oninit = 'oninit';
  let oncreate = 'oncreate';
  let onupdate = 'onupdate';
  let onremove = 'onremove';
  let svgstr = 'http://www.w3.org/2000/svg';

  function lifecycleCall(vnode, methodName, oldNode, l) {
    if (vnode.el) {
      if (vnode.props[methodName]) {
        vnode.props[methodName](vnode, oldNode);
      }

      if (methodName === onremove) {
        l = vnode.children.length;
        while (l--) {
          if (vnode.children[l].el) {
            lifecycleCall(vnode.children[l], onremove);
          }
        }
        vnode.children = [];
      }
    }
  }

  function eventListener(e) {
    if (e.currentTarget.events['on' + e.type]) {
      e.currentTarget.events['on' + e.type](e);
    }
    v.update();
  }

  function createElement(newNode, isSVG) {
    lifecycleCall(newNode, oninit);
    newNode.dom = isSVG ? document.createElementNS(svgstr, newNode.name) : document.createElement(newNode.name);
    newNode.dom.events = {};
  }

  // eslint-disable-next-line complexity, sonarjs/cognitive-complexity
  function patch($parent, newTree, oldTree, isSVG, max, newNode, oldNode, i, isNew, name) {
    if (newTree.length === 0) {
      i = oldTree.length;

      while (i--) {
        if (oldTree[i].el) {
          lifecycleCall(oldTree[i], onremove);
        }
      }

      $parent.textContent = '';
      return;
    }

    max = newTree.length > oldTree.length ? newTree.length : oldTree.length;
    for (i = 0; i < max; i++) {
      newNode = newTree[i];
      oldNode = oldTree[i];

      if (!newNode) {
        // Removed
        if (oldNode !== und) {
          if (oldNode.el) {
            lifecycleCall(oldNode, onremove);
          }
          $parent.removeChild(oldNode.dom);
        }
        continue;
      }

      if (newNode.el === und || !newNode.el) {
        // Is text
        if (newNode.el === und) {
          newTree[i] = newNode = {
            isVnode: true,
            nodeValue: newNode,
            children: [],
            el: false
          };
        }

        if (!oldNode) {
          newNode.dom = document.createTextNode(newNode.nodeValue);
          $parent.appendChild(newNode.dom);
        } else {
          // Replaced
          if (oldNode.el) {
            newNode.dom = document.createTextNode(newNode.nodeValue);
            lifecycleCall(oldNode, onremove);
            $parent.replaceChild(newNode.dom, oldNode.dom);
          } else {
            newNode.dom = oldNode.dom;
            if (newNode.nodeValue !== oldNode.nodeValue) {
              newNode.dom.nodeValue = newNode.nodeValue;
            }
          }
        }

        continue;
      }

      isNew = !v.is.mounted;

      isSVG = isSVG || newNode.isSVG;

      if (!oldNode) {
        // Added
        createElement(newNode, isSVG);

        $parent.appendChild(newNode.dom);
        oldNode = { children: [] };
        isNew = true;
      } else {
        if (newNode.name !== oldNode.name) {
          // Replaced
          createElement(newNode, isSVG);

          lifecycleCall(oldNode, onremove);
          $parent.replaceChild(newNode.dom, oldNode.dom);
          isNew = true;
        } else {
          // Updated
          newNode.dom = oldNode.dom;
          for (name in oldNode.props) {
            if (newNode.props[name] === und) {
              if (typeof oldNode.props[name] === 'function') {
                newNode.dom.removeEventListener(name.slice(2), eventListener);
                continue;
              }

              if (v.is.browser && newNode.dom[name] !== und) {
                newNode.dom[name] = null;
                continue;
              }

              newNode.dom.removeAttribute(name);
            }
          }
        }
      }

      patch(newNode.dom, newNode.children, oldNode.children, isSVG);

      // Update props
      for (name in newNode.props) {
        if ((isNew || newNode.props[name] !== oldNode.props[name]) && newNode.props[name] !== und) {
          if (typeof newNode.props[name] === 'function') {
            switch (name) {
              case oninit:
              case oncreate:
              case onupdate:
              case onremove:
                break;
              default:
                if (!newNode.dom.events[name]) {
                  newNode.dom.events[name] = newNode.props[name];
                  newNode.dom.addEventListener(name.slice(2), eventListener);
                }
                break;
            }

            continue;
          }

          if (v.is.browser && newNode.dom[name] !== und) {
            newNode.dom[name] = newNode.props[name];
            continue;
          }

          newNode.dom.setAttribute(name, newNode.props[name]);
        }
      }

      if (!v.is.mounted && !isNew) {
        lifecycleCall(newNode, oninit);
        lifecycleCall(newNode, oncreate);
      }

      lifecycleCall(newNode, isNew ? oncreate : onupdate, oldNode);
    }
  }

  // If use undom this serializes the dom to string html
  function serialize(el, outer = true, i) {
    if (el.nodeType === 3) {
      return el.textContent;
    }

    let name = el.nodeName.toLowerCase();
    let str = '';
    let attr = el.attributes;
    let child = el.childNodes;

    if (outer) {
      str += `<${name}`;
      i = attr.length;
      while (i--) {
        str += ` ${attr[i].name}="${attr[i].value}"`;
      }

      str += '>';
    }

    for (i = 0; i < child.length; i++) {
      str += serialize(child[i]);
    }

    str += outer ? `</${name}>` : '';
    return str;
  }

  v.update = function (args) {
    args = v.utils.flat(arguments, 0, []);
    if (args[0]) {
      if (!args[0].view && typeof args[0] === 'function') {
        args[0].view = args[0];
      }

      if (args[0].view) {
        mountedComponent = args.shift();
      }
    }

    if (!v.is.updating) {
      v.is.updating = true;
      args.unshift(mountedComponent);
      newTree = v.apply(v, args);
      patch(mainContainer, newTree, oldTree);
      oldTree = newTree;
      v.is.updating = false;
      v.is.mounted = true;
    }

    if (v.is.node) {
      return mainContainer.innerHTML;
    }
  };

  v.mount = function (container) {
    mainContainer = v.is.node
      ? document.createElement('div')
      : typeof container === 'string'
        ? document.querySelectorAll(container)[0]
        : container;

    oldTree = v.utils.dom2vnode(mainContainer).children;

    return v.update.apply(this, v.utils.flat(arguments, 1, []));
  };
};

export default plugin;
