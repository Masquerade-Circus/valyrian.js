let Plugin = v => {
  v.directive('model', ([model, property, event], vnode, oldvnode) => {
    if (vnode.name === 'input') {
      event = event || 'oninput';
      switch (vnode.props.type) {
        case 'checkbox': {
          if (Array.isArray(model[property])) {
            vnode.props[event] = e => {
              let val = e.target.value;
              let idx = model[property].indexOf(val);
              if (idx === -1) {
                model[property].push(val);
              } else {
                model[property].splice(idx, 1);
              }
            };
            vnode.props.checked =
              model[property].indexOf(vnode.dom.value) !== -1;
          } else if ('value' in vnode.props) {
            vnode.props[event] = () => {
              if (model[property] === vnode.props.value) {
                model[property] = null;
              } else {
                model[property] = vnode.props.value;
              }
            };
            vnode.props.checked = model[property] === vnode.props.value;
          } else {
            vnode.props[event] = () => (model[property] = !model[property]);
            vnode.props.checked = model[property];
          }

          v.updateProperty('checked', vnode, oldvnode);
          break;
        }
        case 'radio': {
          vnode.props.checked = model[property] === vnode.dom.value;
          v.updateProperty('checked', vnode, oldvnode);
          break;
        }
        default: {
          vnode.props.value = model[property];
          v.updateProperty('value', vnode, oldvnode);
        }
      }
    } else if (vnode.name === 'select') {
      event = event || 'onclick';
      if (vnode.props.multiple) {
        vnode.props[event] = e => {
          let val = e.target.value;
          if (e.ctrlKey) {
            let idx = model[property].indexOf(val);
            if (idx === -1) {
              model[property].push(val);
            } else {
              model[property].splice(idx, 1);
            }
          } else {
            model[property].splice(0, model[property].length);
            model[property].push(val);
          }
        };
        vnode.children.forEach(child => {
          if (child.name === 'option') {
            let value =
              'value' in child.props
                ? child.props.value
                : child.children.join('').trim();
            child.props.selected = model[property].indexOf(value) !== -1;
          }
        });
      } else {
        vnode.children.forEach(child => {
          if (child.name === 'option') {
            let value =
              'value' in child.props
                ? child.props.value
                : child.children.join('').trim();
            child.props.selected = value === model[property];
          }
        });
      }
    } else if (vnode.name === 'textarea') {
      event = event || 'oninput';
      vnode.children = [model[property]];
    }

    if (!vnode.props[event]) {
      vnode.props[event] = e => (model[property] = e.target.value);
    }

    v.updateProperty(event, vnode, oldvnode);
  });
};

export default Plugin;
