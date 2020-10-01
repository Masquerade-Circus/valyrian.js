"use strict";

const parse5 = require("parse5");

const parseAttributes = (exports.parseAttributes = function (attributes) {
  let attrs = [];
  for (let i = 0, l = attributes.length; i < l; i++) {
    attrs.push({
      nodeName:
        (attributes[i].prefix ? attributes[i].prefix + ":" : "") +
        attributes[i].name,
      nodeValue: attributes[i].value
    });
  }
  return attrs;
});

const parseHtml = (exports.parseHtml = function (html, options = {}) {
  let returnHtml = /^<!DOCTYPE/i.test(html) || /^<html(\s|>)/i.test(html);
  let returnBody = /^<body(\s|>)/i.test(html);
  let returnHead = /^<head(\s|>)/i.test(html);

  if (returnHtml || returnBody || returnHead) {
    let result = parse5.parse(html, options);

    if (returnHtml) {
      return result.childNodes;
    }

    if (returnHead) {
      return [result.childNodes[0].childNodes[0]];
    }

    if (returnBody) {
      return [result.childNodes[0].childNodes[1]];
    }
  }

  return parse5.parseFragment(html, options).childNodes;
});

function generateDom(tree) {
  let childNodes = [];
  for (let i = 0, l = tree.length; i < l; i++) {
    let node = tree[i];
    if (node.nodeName === "#text") {
      childNodes.push(new Text(node.value));
    } else {
      let element = new Element(1, node.nodeName);
      element.attributes = parseAttributes(node.attrs);
      element.childNodes = generateDom(node.childNodes);
      childNodes.push(element);
    }
  }
  return childNodes;
}

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
  return (o) => toLower(o.nodeName) === toLower(name);
}

function isChildNode(node, child) {
  let index = node.childNodes
    ? findWhere(node.childNodes, child, true, true)
    : -1;
  if (index === -1) {
    throw new Error("The node is not child of this element");
  }
  return true;
}

let selfClosingTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
  "!doctype"
];

function serialize(dom) {
  if (dom.nodeType === 3) {
    return dom.textContent;
  } else if (dom.nodeType === 1) {
    let name = toLower(dom.nodeName);
    let str = "<" + name;
    for (let i = 0, l = dom.attributes.length; i < l; i++) {
      str +=
        " " +
        dom.attributes[i].nodeName +
        '="' +
        dom.attributes[i].nodeValue +
        '"';
    }

    if (selfClosingTags.indexOf(name) === -1) {
      str += ">";
      if (dom.childNodes && dom.childNodes.length > 0) {
        for (let i = 0, l = dom.childNodes.length; i < l; i++) {
          let child = serialize(dom.childNodes[i]);
          if (child) {
            str += child;
          }
        }
      }
      str += "</" + name + ">";
    } else {
      str += "/>";
    }

    return str;
  }
}

class Node {
  constructor(nodeType, nodeName) {
    this.nodeType = nodeType;
    this.nodeName = toLower(nodeName);
    this.childNodes = [];
    this.nodeValue = "";
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
    if (isChildNode(this, ref)) {
      this.insertBefore(child, ref);
      ref.remove();
      return ref;
    }
  }
  removeChild(child) {
    if (isChildNode(this, child)) {
      child.remove();
      return child;
    }
  }
  remove() {
    if (this.parentNode) {
      splice(this.parentNode.childNodes, this, false, true);
      this.parentNode = null;
    }
  }
}
exports.Node = Node;

class Text extends Node {
  constructor(text) {
    super(3, "#text");
    this.textContent = text;
  }
  set textContent(text) {
    this.nodeValue = String(text);
  }
  get textContent() {
    return this.nodeValue;
  }
}
exports.Text = Text;

class Element extends Node {
  constructor(nodeType, nodeName) {
    super(nodeType || 1, nodeName);
    this.attributes = [];
    this.attachedListeners = {};
    let updateStyles = (state) => {
      let str = "";
      for (let key in state) {
        let value = state[key];
        if (
          typeof value !== "undefined" &&
          value !== null &&
          String(value).length > 0
        ) {
          str += `${key}: ${state[key]};`;
        }
      }
      if (str.length === 0) {
        this.removeAttribute("style");
      } else {
        this.setAttribute("style", str);
      }
    };
    this.style = new Proxy(
      {},
      {
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
      }
    );

    this.classList = {
      toggle: (item, force) => {
        if (item) {
          let classes = (this.getAttribute("class") || "").split(" ");
          let itemIndex = classes.indexOf(item);
          if (force && itemIndex === -1) {
            classes.push(item);
          }

          if (!force && itemIndex !== -1) {
            classes.splice(itemIndex, 1);
          }

          let final = classes.join(" ").trim();
          if (final.length) {
            this.setAttribute("class", classes.join(" ").trim());
          } else {
            this.removeAttribute("class");
          }
        }
      }
    };
  }

  setAttribute(name, value) {
    let attr = findWhere(
      this.attributes,
      createAttributeFilter(name),
      false,
      false
    );
    if (!attr) {
      this.attributes.push((attr = { nodeName: name, nodeValue: value }));
    } else {
      attr.nodeValue = value;
    }
  }

  getAttribute(name) {
    let attr = findWhere(
      this.attributes,
      createAttributeFilter(name),
      false,
      false
    );
    return attr && attr.nodeValue;
  }

  removeAttribute(name) {
    splice(this.attributes, createAttributeFilter(name), false, false);
  }

  addEventListener(type, handler) {
    (
      this.attachedListeners[toLower(type)] ||
      (this.attachedListeners[toLower(type)] = [])
    ).push(handler);
  }

  removeEventListener(type, handler) {
    splice(this.attachedListeners[toLower(type)], handler, false, true);
  }

  dispatchEvent(event) {
    let t = (event.target = this),
      c = event.cancelable,
      l,
      i;
    do {
      event.currentTarget = t;
      l = t.attachedListeners && t.attachedListeners[toLower(event.type)];
      if (l) {
        for (i = l.length; i--; ) {
          if ((l[i].call(t, event) === false || event._end) && c) {
            event.defaultPrevented = true;
          }
        }
      }
    } while (event.bubbles && !(c && event._stop) && (t = t.parentNode));
    return l !== null;
  }

  set textContent(text) {
    this.nodeValue = String(text);
    this.childNodes = this.nodeValue.trim().length
      ? [new Text(this.nodeValue)]
      : [];
  }
  get textContent() {
    return this.nodeValue;
  }

  get innerHTML() {
    let str = "";
    for (let i = 0, l = this.childNodes.length; i < l; i++) {
      str += serialize(this.childNodes[i]);
    }
    return str;
  }

  set innerHTML(html) {
    this.textContent = "";
    let childNodes = generateDom(parseHtml(html));
    for (let i = 0, l = childNodes.length; i < l; i++) {
      this.appendChild(childNodes[i]);
    }
  }

  get outerHTML() {
    return serialize(this);
  }
}
exports.Element = Element;

class Document extends Element {
  constructor() {
    super(9, "#document");
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
exports.Document = Document;
