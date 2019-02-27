let plugin = function (v) {
  let mountedComponent;
  let oldTree;
  let mainContainer;
  let und;
  let oncreate = 'oncreate';
  let onupdate = 'onupdate';
  let onremove = 'onremove';
  let svgstr = 'http://www.w3.org/2000/svg';

  function lifecycleCall(vnode, methodName, oldNode, l) {
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

  function eventListener(e) {
    if (e.currentTarget.events['on' + e.type]) {
      e.currentTarget.events['on' + e.type](e);
    }
    v.update();
  }

  function createElement(newNode, isSVG) {
    newNode.dom = isSVG ? document.createElementNS(svgstr, newNode.name) : document.createElement(newNode.name);
    newNode.dom.events = {};
  }

  // eslint-disable-next-line complexity, sonarjs/cognitive-complexity
  function patch($parent, newTree, oldTree, isSVG, newNode, oldNode, i, isNew, name) {
    if (newTree.length === 0) {

      while (oldTree.length) {
        oldNode = oldTree.pop();
        if (oldNode.el) {
          lifecycleCall(oldNode, onremove);
        }
      }

      $parent.textContent = '';
    } else {
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

        if (newNode.el === und || !newNode.el) {
          if (newNode.el === und) {
            newTree[i] = newNode = {
              props: {},
              isVnode: true,
              nodeValue: newNode,
              children: [],
              el: false
            };
          }

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

            for (name in oldNode.props) {
              if (newNode.props[name] === und) {
                if (typeof oldNode.props[name] === 'function') {
                  newNode.dom.removeEventListener(name.slice(2), eventListener);
                } else if (v.is.browser && !isSVG && newNode.dom[name] !== und) {
                  newNode.dom[name] = null;
                } else {
                  newNode.dom.removeAttribute(name);
                }
              }
            }
          }

          // Update props
          for (name in newNode.props) {
            if (newNode.props[name] !== und) {
              if (typeof newNode.props[name] === 'function') {
                switch (name) {
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
              } else if (
                v.is.browser &&
                !isSVG &&
                newNode.dom[name] !== und &&
                newNode.props[name] !== newNode.dom[name]
              ) {
                newNode.dom[name] = newNode.props[name];
              } else if (newNode.props[name] !== oldNode.props[name]) {
                newNode.dom.setAttribute(name, newNode.props[name]);
              }
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

  v.update = function () {
    if (v.is.node || !v.is.updating) {
      v.is.updating = true;
      oldTree = patch(mainContainer, v(mountedComponent), oldTree);
      v.is.updating = false;
    }

    return mainContainer.innerHTML;
  };

  v.mount = function (container, component) {
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

    return v.update();
  };
};

export default plugin;
