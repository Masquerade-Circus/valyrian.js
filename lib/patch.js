export default function (v) {
  let und;
  let mountedComponent;
  let oldTree;
  let mainContainer;
  let oncreate = 'oncreate';
  let onupdate = 'onupdate';
  let onremove = 'onremove';
  let onbeforeupdate = 'onbeforeupdate';
  let svgstr = 'http://www.w3.org/2000/svg';

  let bindings = [];

  function runBindings(i, item, values, changed, name, val) {
    i = bindings.length;
    while (i--) {
      item = bindings[i];
      values = item.v.props[item.a] || '';
      changed = false;
      for (name in item.b) {
        val = item.b[name](item.v);
        if (val !== item.p[name]) {
          item.p[name] = val;
          changed = true;
        }
        if (typeof val === 'string') {
          values += ` ${val}`;
        } else if (val) {
          values += ` ${name}`;
        }
      }
      if (changed) {
        if (item.v.dom[item.a] !== und && item.v.dom[item.a] !== values && !item.v.isSVG) {
          item.v.dom[item.a] = values;
        } else {
          item.v.dom.setAttribute(item.a, values);
        }
      }
    }
    setTimeout(() => runBindings(), 0);
  }

  function lifecycleCall(vnode, methodName, oldNode, vnodeNodeChild) {
    if (methodName === onremove) {
      while (vnode.children.length) {
        vnodeNodeChild = vnode.children.pop();
        if (vnodeNodeChild.el) {
          lifecycleCall(vnodeNodeChild, onremove);
        }
      }
    }

    if (vnode.props[methodName]) {
      return vnode.props[methodName](vnode, oldNode);
    }
  }

  function eventListener(e) {
    if (e.currentTarget.events[e.type]) {
      e.currentTarget.events[e.type](e);
      if (!e.defaultPrevented) {
        v.update();
      }
    }
  }

  function createElement(newNode, isSVG) {
    newNode.dom = isSVG ? document.createElementNS(svgstr, newNode.name) : document.createElement(newNode.name);
    newNode.dom.events = {};
  }

  // eslint-disable-next-line complexity, sonarjs/cognitive-complexity
  function patch($parent, newTree, oldTree, isSVG, newNode, oldNode, i, isNew, name, shortName, prop, preventUpdate) {
    // Remove deleted nodes
    while (oldTree.length > newTree.length) {
      oldNode = oldTree.pop();
      if (oldNode.el) {
        lifecycleCall(oldNode, onremove);
      }
      $parent.removeChild(oldNode.dom);
    }

    for (i = 0; i < newTree.length; i++) {
      newNode = newTree[i];
      oldNode = oldTree[i];


      if (!newNode.el) {
        // Added
        if (oldNode === und) {
          newNode.dom = document.createTextNode(newNode.nodeValue);
          $parent.appendChild(newNode.dom);
          // Replaced element
        } else if (oldNode.el) {
          newNode.dom = document.createTextNode(newNode.nodeValue);
          lifecycleCall(oldNode, onremove);
          $parent.replaceChild(newNode.dom, oldNode.dom);
          // Replaced text
        } else {
          newNode.dom = oldNode.dom;
          if (newNode.nodeValue !== oldNode.nodeValue) {
            newNode.dom.nodeValue = newNode.nodeValue;
          }
        }
      } else {
        isNew = !v.is.mounted;
        isSVG = isSVG || newNode.isSVG;
        preventUpdate = false;

        // Added
        if (oldNode === und) {
          createElement(newNode, isSVG);
          $parent.appendChild(newNode.dom);
          oldNode = { children: [], props: {} };
          isNew = true;
          // Replaced
        } else if (newNode.name !== oldNode.name) {
          createElement(newNode, isSVG);
          lifecycleCall(oldNode, onremove);
          $parent.replaceChild(newNode.dom, oldNode.dom);
          isNew = true;
          // Updated
        } else {
          newNode.dom = oldNode.dom;

          preventUpdate = lifecycleCall(newNode, onbeforeupdate, oldNode) === false;

          if (preventUpdate) {
            newNode.children = oldNode.children;
          } else {
            for (name in oldNode.props) {
              if (newNode.props[name] === und && !(name[0] === 'v' && name[1] === '-')) {
                if (typeof oldNode.props[name] === 'function') {
                  shortName = name.slice(2);
                  if (newNode.dom.events[shortName]) {
                    delete newNode.dom.events[shortName];
                    newNode.dom.removeEventListener(shortName, eventListener);
                  }
                } else if (newNode.dom[name] !== und) {
                  newNode.dom[name] = null;
                } else {
                  newNode.dom.removeAttribute(name);
                }
              }
            }
          }
        }

        if (!preventUpdate) {
          for (name in newNode.props) {
            prop = newNode.props[name];
            if (typeof prop === 'function') {
              shortName = name.slice(2);
              switch (name) {
                case oncreate:
                case onupdate:
                case onremove:
                case 'onbeforeupdate':
                  break;
                default:
                  if (!newNode.dom.events[shortName]) {
                    newNode.dom.addEventListener(shortName, eventListener);
                  }
                  newNode.dom.events[shortName] = prop;
                  break;
              }
            } else if (newNode.dom[name] !== und && newNode.dom[name] !== prop && !isSVG) {
              newNode.dom[name] = prop;
            } else if (name[0] === 'v' && name[1] === '-') {
              bindings.push({
                v: newNode,
                a: name.slice(2),
                b: prop,
                p: {}
              });
            } else if (prop !== oldNode.props[name]) {
              newNode.dom.setAttribute(name, prop);
            }
          }

          lifecycleCall(newNode, isNew ? oncreate : onupdate, oldNode);
          patch(newNode.dom, newNode.children, oldNode.children, isSVG);
        }


      }
    }

    return newTree;
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
    bindings = [];
    args = v.utils.flat(arguments, 0, []);
    if (v.is.node || !v.is.updating) {
      v.is.updating = true;
      args.unshift(mountedComponent);
      oldTree = patch(mainContainer, v.apply(v, args), oldTree);
      v.is.updating = false;
    }

    if (v.is.node) {
      return mainContainer.innerHTML;
    }
  };

  v.mount = function (container, component) {
    let args = v.utils.flat(arguments, 2, []);
    mainContainer = v.is.node
      ? document.createElement('div')
      : typeof container === 'string'
        ? document.querySelectorAll(container)[0]
        : container;

    oldTree = v.utils.dom2vnode(mainContainer).children;

    if (!component.view && typeof component === 'function') {
      component.view = component;
    }

    if (component.view) {
      mountedComponent = component;
    }

    v.is.mounted = true;
    runBindings();

    return v.update.apply(v, args);
  };
}
