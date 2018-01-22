let PatchFactory = function(window){
    let document = window.document;

    function setProp($target, name, value) {
      if (name === 'className') {
        $target.setAttribute('class', value);
        return;
      }

      if (typeof value === 'function') {
      	$target[name] = value.bind($target);
        return;
      }

      if (typeof value === 'boolean') {
        if (value) {
          $target.setAttribute(name, value);
        }
        $target[name] = value;
        return;
      }

      $target.setAttribute(name, value);
    }

    function removeProp($target, name, value) {
      if (name === 'className') {
        $target.removeAttribute('class');
        return;
      }

      if (typeof value === 'function') {
      	$target[name] = undefined;
        return;
      }

      if (typeof value === 'boolean') {
        $target.removeAttribute(name);
      	$target[name] = false;
        return;
      }

      $target.removeAttribute(name);
    }

    function updateProp($target, name, newVal, oldVal) {
      if (!newVal) {
        removeProp($target, name, oldVal);
        return;
      }

      if (!oldVal || newVal !== oldVal) {
        setProp($target, name, newVal);
      }
    }

    function updateProps($target, newProps, oldProps = {}) {
      const props = Object.assign({}, newProps, oldProps);
      for (let i in props){
      	updateProp($target, i, newProps[i], oldProps[i]);
      }
    }

    function createElement(node) {
        var $el = node && node.name ?
            node.name === "svg" ?
                document.createElementNS("http://www.w3.org/2000/svg", node.name) :
                document.createElement(node.name) :
            document.createTextNode(node);

            if (node && node.props){
                updateProps($el, node.props);
            }

            if (node && node.children){
              for (let i = 0; i < node.children.length; i++){
                $el.appendChild(createElement(node.children[i]));
              }
            }

            return $el;
    }

    function changed(node1, node2) {
      return typeof node1 !== typeof node2 ||
            node1 != node2 ||
            node1.name !== node2.name;
    }

    function patch($parent, newNode, oldNode, index = 0) {
      if (oldNode == newNode){

      } else if (!oldNode) {
        $parent.appendChild(createElement(newNode));
      } else if (!newNode) {
        $parent.removeChild($parent.childNodes[index]);
      } else if (changed(newNode, oldNode)) {
        $parent.replaceChild(createElement(newNode),$parent.childNodes[index]);
      } else if (newNode.name) {
        updateProps(
          $parent.childNodes[index],
          newNode.props,
          oldNode.props
        );
        const newLength = newNode.children.length;
        const oldLength = oldNode.children.length;
        for (let i = 0; i < newLength || i < oldLength; i++) {
          patch(
            $parent.childNodes[index],
            newNode.children[i],
            oldNode.children[i],
            i
          );
        }
      }

      return $parent;
    };

    return patch;
};

module.exports = PatchFactory;
