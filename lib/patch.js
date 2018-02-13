let PatchFactory = function(window){
    let document = window.document;

    function setProp($target, name, value) {
      if (name === 'className') {
        $target.setAttribute('class', value);
        return;
      }

      if (typeof value === 'function') {
      	$target[name] = value.bind ? value.bind($target) : value;
        return;
      }

      if (typeof value === 'boolean') {
        $target[name] = value;
      }

      if (value !== undefined && value !== false) {
          $target.setAttribute(name, value);
      } else {
          $target.removeAttribute(name);
      }
    }

    function updateProps($target, newProps, oldProps = {}) {
      const props = Object.assign({}, newProps, oldProps);
      for (let name in props){
        if (newProps[name] !== oldProps[name]) {
          setProp($target, name, newProps[name]);
        }
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

    function removeElement($parent, index){
        console.log(Array.isArray($parent.childNodes));
        $parent.removeChild($parent.childNodes[index]);
    }

    function patch($parent, newNode, oldNode, index = 0) {
      if (oldNode == newNode){
          console.log(1, newNode);
      } else if (!oldNode) {
          console.log(2, $parent, newNode);
        $parent.appendChild(createElement(newNode));
      } else if (!newNode) {
          console.log(3, newNode);
          removeElement($parent, index);
      } else if (typeof newNode !== typeof oldNode || newNode.name !== oldNode.name) {
          console.log(4, newNode, oldNode, newNode !== oldNode);
        $parent.replaceChild(createElement(newNode),$parent.childNodes[index]);
      } else if (newNode.name) {
          console.log(5, newNode, $parent, index, $parent.childNodes[index]);
          console.log(typeof newNode, typeof oldNode, newNode.name, oldNode.name);
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
