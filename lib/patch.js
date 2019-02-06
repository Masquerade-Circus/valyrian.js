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

  function lifecycleCall(vnode, methodName, oldNode, i, l) {
    if (vnode.nt === 1) {
      if (vnode.props[methodName] !== und) {
        vnode.props[methodName](vnode, oldNode);
      }

      if (methodName === onremove) {
        i = 0;
        l = vnode.children.length;
        for (; i < l; i++) {
          lifecycleCall(vnode.children[i], onremove);
        }
        vnode.children = [];
      }
    }
  }

  function eventListener(e) {
    if (e.currentTarget.events['on' + e.type] !== und) {
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
      $parent.textContent = '';
      return;
    }

    max = newTree.length > oldTree.length ? newTree.length : oldTree.length;
    for (i = 0; i < max; i++) {
      newNode = newTree[i];
      oldNode = oldTree[i];

      if (newNode === und) {
        // Removed
        if (oldNode !== und) {
          if (oldNode.nt === 3) {
            lifecycleCall(oldNode, onremove);
          }
          $parent.removeChild(oldNode.dom);
        }
        continue;
      }

      if (newNode.nt === und || newNode.nt === 3) {
        // Is text
        if (newNode.nt === und) {
          newTree[i] = newNode = {
            name: '#text',
            isVnode: true,
            nodeValue: newNode,
            children: [],
            nt: 3
          };
        }

        if (oldNode === und) {
          newNode.dom = document.createTextNode(newNode.nodeValue);
          $parent.appendChild(newNode.dom);
        } else {
          // Replaced
          if (oldNode.nt === 1) {
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

      if (oldNode === und) {
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

              if (v.is.node || isSVG || newNode.dom[name] === und) {
                newNode.dom.removeAttribute(name);
                continue;
              }

              newNode.dom[name] = null;
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
                if (newNode.dom.events[name] === und) {
                  newNode.dom.events[name] = newNode.props[name];
                  newNode.dom.addEventListener(name.slice(2), eventListener);
                }
                break;
            }

            continue;
          }

          if (v.is.node || isSVG || newNode.dom[name] === und) {
            newNode.dom.setAttribute(name, newNode.props[name]);
            continue;
          }

          newNode.dom[name] = newNode.props[name];
        }
      }

      if (!v.is.mounted && !isNew) {
        lifecycleCall(newNode, oninit);
        lifecycleCall(newNode, oncreate);
      }

      lifecycleCall(newNode, isNew ? oncreate : onupdate, oldNode);
    }
  }

  function serialize(el, outer = true) {
    if (el.nodeType === 3) {
      return el.textContent;
    }

    let name = el.nodeName.toLowerCase();
    let str = '';
    let i;
    let attr = el.attributes;
    let child = el.childNodes;

    if (outer) {
      str += `<${name}`;

      for (i = 0; i < attr.length; i++) {
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
    if (args[0] !== und && args[0].isComponent !== und) {
      mountedComponent = args.shift();
    }

    return new Promise((resolve) => {
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
        return resolve(serialize(mainContainer, false));
      }
      resolve();
    });
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
