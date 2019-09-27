function findWhere(arr, fn, returnIndex, byValue) {
  let i = arr.length;
  while (i--) {
    if (byValue ? arr[i] === fn : fn(arr[i])) {
      break;
    }
  }
  return returnIndex ? i : arr[i];
}

function toLower(str) {
  return String(str).toLowerCase();
}

function splice(arr, item, add, byValue) {
  let i = arr ? findWhere(arr, item, true, byValue) : -1;
  if (~i) {
    add ? arr.splice(i, 0, add) : arr.splice(i, 1);
  }
  return i;
}

function createAttributeFilter(name) {
  return o => toLower(o.nodeName) === toLower(name);
}

let selfClosingTags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
  '!doctype'
];

function serialize(dom) {
  if (dom.nodeType === 3) {
    return dom.textContent;
  } else if (dom.nodeType === 1) {
    let name = toLower(dom.nodeName);
    let str = '<' + name;
    for (let i = 0, l = dom.attributes.length; i < l; i++) {
      str += ' ' + dom.attributes[i].nodeName + '="' + dom.attributes[i].nodeValue + '"';
    }

    if (selfClosingTags.indexOf(name) === -1) {
      str += '>';
      if (dom.childNodes && dom.childNodes.length > 0) {
        for (let i = 0, l = dom.childNodes.length; i < l; i++) {
          let child = serialize(dom.childNodes[i]);
          if (child) {
            str += child;
          }
        }
      }
      str += '</' + name + '>';
    } else {
      str += '/>';
    }

    return str;
  }
}

class Node {
  constructor(nodeType, nodeName) {
    this.nodeType = nodeType;
    this.nodeName = toLower(nodeName);
    this.childNodes = [];
    this.nodeValue = '';
  }
  appendChild(child) {
    this.insertBefore(child);
    return child;
  }
  insertBefore(child, ref) {
    child.remove();
    child.parentNode = this;
    if (ref) {
      splice(this.childNodes, ref, child, true);
    } else {
      this.childNodes.push(child);
    }
    return child;
  }
  replaceChild(child, ref) {
    if (ref.parentNode === this) {
      this.insertBefore(child, ref);
      ref.remove();
      return ref;
    }
  }
  removeChild(child) {
    splice(this.childNodes, child, false, true);
    return child;
  }
  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }
  set textContent(text) {
    this.nodeValue = String(text);
    for (let i = 0, l = this.childNodes.length; i < l; i++) {
      this.childNodes[i].remove();
    }
  }
  get textContent() {
    return this.nodeValue;
  }

  get innerHTML() {
    let str = '';
    for (let i = 0, l = this.childNodes.length; i < l; i++) {
      str += serialize(this.childNodes[i]);
    }
    return str;
  }

  get outerHTML() {
    return serialize(this);
  }
}

export class Text extends Node {
  constructor(text) {
    super(3, '#text');
    this.textContent = text;
  }
  set textContent(text) {
    this.nodeValue = String(text);
  }
  get textContent() {
    return this.nodeValue;
  }
}

export class Element extends Node {
  constructor(nodeType, nodeName) {
    super(nodeType || 1, nodeName);
    this.attributes = [];
    this.attachedListeners = {};
    let updateStyles = (state) => {
      let str = '';
      for (let key in state) {
        let value = state[key];
        if (typeof value !== 'undefined' && value !== null && String(value).length > 0) {
          str += `${key}: ${state[key]};`;
        }
      }
      if (str.length === 0) {
        this.removeAttribute('style');
      } else {
        this.setAttribute('style', str);
      }
    };
    this.style = new Proxy({}, {
      get: (state, prop) => state[prop],
      set: (state, prop, value) => {
        state[prop] = value;
        updateStyles(state);
        return true;
      },
      deleteProperty: (state, prop) => {
        delete state[prop];
        updateStyles(state);
        return true;
      }
    });

  }

  setAttribute(name, value) {
    let attr = findWhere(this.attributes, createAttributeFilter(name), false, false);
    if (!attr) {
      this.attributes.push(attr = { nodeName: name, nodeValue: value });
    }
  }

  getAttribute(name) {
    let attr = findWhere(this.attributes, createAttributeFilter(name), false, false);
    return attr && attr.nodeValue;
  }

  removeAttribute(name) {
    splice(this.attributes, createAttributeFilter(name), false, false);
  }

  addEventListener(type, handler) {
    (this.attachedListeners[toLower(type)] || (this.attachedListeners[toLower(type)] = [])).push(handler);
  }

  removeEventListener(type, handler) {
    splice(this.attachedListeners[toLower(type)], handler, false, true);
  }

  dispatchEvent(event) {
    let t = event.target = this,
      c = event.cancelable,
      l, i;
    do {
      event.currentTarget = t;
      l = t.attachedListeners && t.attachedListeners[toLower(event.type)];
      if (l) {
        for (i = l.length; i--;) {
          if ((l[i].call(t, event) === false || event._end) && c) {
            event.defaultPrevented = true;
          }
        }
      }
    } while (event.bubbles && !(c && event._stop) && (t = t.parentNode));
    return l != null;
  }
}

export class Document extends Element {
  constructor() {
    super(9, '#document');
  }

  createElement(type) {
    return new Element(null, String(type).toUpperCase());
  }

  createElementNS(ns, type) {
    let element = this.createElement(type);
    element.namespace = ns;
    return element;
  }

  createTextNode(text) {
    return new Text(text);
  }
}
