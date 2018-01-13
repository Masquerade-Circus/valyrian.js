(function(){
    let VFactory = function(){

        let Router = require('./router');
        let h = require('./h');
        let S = require('./s');

        let v = function (...args) {
            if (v.isComponent(args[0])) {
                return v.render.apply(v,args);
            }

            return h.apply(h, args);
        };

        v.router = Router();

        v.isNode = typeof window === 'undefined';

        var w = v.isNode ? require('html-element') : window,
            document = w.document;

        var lifecycle = [];

        // node to vnode
        var vnode = function(element) {
            if (element){
                return {
                  name: element.nodeName.toLowerCase(),
                  props: {},
                  children: Array.prototype.map.call(element.childNodes, (element) => {
                      return element.nodeType === 3
                        ? element.nodeValue
                        : vnode(element);
                  })
                };
            }
        };

        var copy = function(a, b) {
            var target = {};

            for (var i in a) target[i] = a[i];
            for (var i in b) target[i] = b[i];

            return target;
        };

        var getKey = function(node) {
            return node && node.props ? node.props.key : null;
        };

        var setElementProp = function(element, name, value, isSVG, oldValue) {
            if (name === "key") {
                return;
            }

            if (name === "style") {
                for (var i in copy(oldValue, value)) {
                    element[name][i] = value == null || value[i] == null ? "" : value[i];
                }
                return;
            }

            if (typeof value === "function" || (name in element && !isSVG)) {
                element[name] = value == null ? "" : value;
                return;
            }

            if (value != null && value !== false) {
                element.setAttribute(name, value);
                return;
            }

            if (value == null || value === false) {
                element.removeAttribute(name);
                return;
            }
        };

        var createElement = function(node, isSVG) {
            var name,
                i = 0,
                element = node && node.name
                    ? (isSVG === true || node.name === "svg")
                        ? document.createElementNS("http://www.w3.org/2000/svg", node.name)
                        : document.createElement(node.name)
                    : document.createTextNode(node);

            if (node && node.props) {
                if (node.props.oncreate) {
                  lifecycle.push(function () {
                    node.props.oncreate(element);
                  });
                }

                for (; i < node.children.length; i++) {
                  element.appendChild(createElement(node.children[i], isSVG));
                }

                for (name in node.props) {
                  setElementProp(element, name, node.props[name], isSVG);
                }
            }

            return element;
        };

        var updateElement = function(element, oldProps, props, isSVG) {
            var name;
            for (name in copy(oldProps, props)) {
              if (
                props[name] !==
                (name === "value" || name === "checked"
                  ? element[name]
                  : oldProps[name])
              ) {
                setElementProp(element, name, props[name], isSVG, oldProps[name]);
              }
            }

            if (props && props.onupdate) {
              lifecycle.push(function () {
                props.onupdate(element, oldProps, props);
              });
            }
        };

        var removeChildren = function(element, node, props) {
            if (node !== undefined){
                var props = node.props;
                if (props) {
                  for (var i = 0; i < node.children.length; i++) {
                    removeChildren(element.childNodes[i], node.children[i]);
                  }

                  if (props.ondestroy) {
                    props.ondestroy(element);
                  }
                }
            }
          return element;
        };

        var removeElement = function(parent, element, node) {
            var done = () => parent.removeChild(removeChildren(element, node));

          if (node.props && node.props.onremove){
              node.props.onremove(element, done);
              return;
          }

          done();
        };

        var patch = function(parent, element, oldNode, node, isSVG, nextSibling) {
          if (node === oldNode) {

          } else if (oldNode == null) {

            element = parent.insertBefore(createElement(node, isSVG), element);

          } else if (
              node.name &&
              node.name ===
              oldNode.name
          ) {
            updateElement(
              element,
              oldNode.props,
              node.props,
              (isSVG === true || node.name === "svg")
            );

            var oldElements = [];
            var oldKeyed = {};
            var newKeyed = {};

            for (var i = 0; i < oldNode.children.length; i++) {
              oldElements[i] = element.childNodes[i];

              var oldChild = oldNode.children[i];
              var oldKey = getKey(oldChild);

              if (null != oldKey) {
                oldKeyed[oldKey] = [oldElements[i], oldChild];
              }
            }

            var i = 0;
            var j = 0;

            while (j < node.children.length) {
              var oldChild = oldNode.children[i];
              var newChild = node.children[j];

              var oldKey = getKey(oldChild);
              var newKey = getKey(newChild);

              if (newKeyed[oldKey]) {
                i++;
                continue;
              }

              if (newKey == null) {
                if (oldKey == null) {
                  patch(element, oldElements[i], oldChild, newChild, isSVG);
                  j++;
                }
                i++;
              } else {
                var recyledNode = oldKeyed[newKey] || [];

                if (oldKey === newKey) {
                  patch(element, recyledNode[0], recyledNode[1], newChild, isSVG);
                  i++;
                } else if (recyledNode[0]) {
                  patch(
                    element,
                    element.insertBefore(recyledNode[0], oldElements[i]),
                    recyledNode[1],
                    newChild,
                    isSVG
                  );
                } else {
                  patch(element, oldElements[i], null, newChild, isSVG);
                }

                j++;
                newKeyed[newKey] = newChild;
              }
            }

            while (i < oldNode.children.length) {
              var oldChild = oldNode.children[i];
              if (getKey(oldChild) == null) {
                removeElement(element, oldElements[i], oldChild);
              }
              i++;
            }

            for (var i in oldKeyed) {
              if (!newKeyed[oldKeyed[i][1].props.key]) {
                removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
              }
            }
          } else if (node.name === oldNode.name) {
            element.nodeValue = node;
          } else {
            element = parent.insertBefore(
              createElement(node, isSVG),
              (nextSibling = element)
            );
            removeElement(parent, nextSibling, oldNode);
          }
          return element;
        };

        v.clock = function(start) {
            let end, p = typeof performance !== 'undefined' ? performance : process;
            if (p !== undefined && p.hrtime !== undefined) {
                if (!start) {
                    return process.hrtime();
                };
                end = process.hrtime(start);
                return Math.round((end[0] * 1000) + (end[1] / 1000000));
            }

            if (p !== undefined && p.now !== undefined) {
                if (!start) {
                    return performance.now();
                }

                end = performance.now();
                return end - start;
            }
        };

        v.getFixedFrameRateMethod = function(fps = 5, callback) {
            let time,
                previousTime = v.clock(),
                method = function () {
                    time = v.clock();
                    if (v.clock(previousTime) > 1000 / fps) {
                        previousTime = time;
                        if (typeof callback === 'function') {
                            if (typeof requestAnimationFrame === 'function') {
                                requestAnimationFrame(callback.bind(this));
                            } else {
                                callback.call(this);
                            }
                        }
                    }
                };

            return method;
        };

        var mounted = false;
        v.container = document.createElement('div');
        var root = undefined;
        var tree = vnode(root);
        var newTree = undefined;
        var rootComponent = undefined;

        v.assignAttributes = function(component, attributes = {}){
            if (attributes.name && attributes.props && Array.isArray(attributes.children)){
                component.attributes = {children: attributes};
            } else {
                component.attributes = Object.assign({}, component.attributes, attributes);
            }
        };

        v.mount = function(container, component, attributes = {}){
            if (container === undefined){
                throw new Error('A container element is required as first element');
                return;
            }

            if (!v.isComponent(component)){
                throw new Error('A component is required as a second argument');
                return;
            }

          v.assignAttributes(component, attributes);

          root = v.isNode ? root : (container && container.children[0]);
          tree = vnode(root);
          rootComponent = component;
          v.container = container;
          mounted = true;
          return v.update();
        };

        v.render = function (component, attributes = {}) {
            if (!v.isComponent(component)){
                return;
            }

            v.assignAttributes(component, attributes);

            return component.view();
        };

        v.update = function(component, attributes = {}){
          var next;
          if (v.isComponent(component)){
              v.assignAttributes(component, attributes);
              rootComponent = component;
          };

          newTree = v.render(rootComponent);
          root = patch(v.container, root, tree, newTree);
          tree = newTree;
          while ((next = lifecycle.pop())) next();
          return v.isNode ? root.outerHTML : root;
        };

        v.isComponent = function(component){
            return typeof component === 'object' &&
                component !== null &&
                typeof component.view === 'function';
        };

        var s = S(v);

        v.data = function(...args) {
            return s.storeData.apply(s, args);
        };

        v.onStoreUpdate = function(...args) {
            return s.onStoreUpdate.apply(s, args);
        };

        v.onStoreUpdate(function(){
            v.update();
        });

        return v;
    };

    this.Valyrian = VFactory;
})();
