"use strict";

const { DOCUMENT_MODE } = require("parse5/lib/common/html");

const parse5 = require("parse5");

function parseAttributes(attributes = []) {
  let attrs = [];
  for (let i = 0, l = attributes.length; i < l; i++) {
    attrs.push({
      nodeName: (attributes[i].prefix ? attributes[i].prefix + ":" : "") + attributes[i].name,
      nodeValue: attributes[i].value
    });
  }
  return attrs;
}

function htmlToDom(html, options = {}) {
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
}

function toLower(str) {
  return String(str).toLowerCase();
}

function isChildNode(node, child) {
  let index = node.childNodes.indexOf(child);
  if (index === -1) {
    throw new Error("The node is not child of this element");
  }
  return true;
}

let selfClosingTags = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr", "!doctype"];

function domToHtml(dom) {
  if (dom.nodeType === 3) {
    return dom.textContent;
  } else if (dom.nodeType === 1) {
    let name = toLower(dom.nodeName);
    let str = "<" + name;
    for (let i = 0, l = dom.attributes.length; i < l; i++) {
      str += " " + dom.attributes[i].nodeName + '="' + dom.attributes[i].nodeValue + '"';
    }

    if (selfClosingTags.indexOf(name) === -1) {
      str += ">";
      if (dom.childNodes && dom.childNodes.length > 0) {
        for (let i = 0, l = dom.childNodes.length; i < l; i++) {
          let child = domToHtml(dom.childNodes[i]);
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

function domToHyperscript(childNodes, depth = 1) {
  let spaces = "";
  for (let i = 0; i < depth; i++) {
    spaces += "  ";
  }

  return childNodes
    .map((item) => {
      if (item.nodeType === 10) {
        return `\n${spaces}"<!DOCTYPE html>"`;
      } else if (item.nodeType === 3) {
        return `\n${spaces}"${item.nodeValue}"`;
      } else {
        let str = `\n${spaces}v("${item.nodeName}", `;

        if (item.attributes) {
          let attrs = {};
          for (let i = 0, l = item.attributes.length; i < l; i++) {
            let attr = item.attributes[i];
            attrs[attr.nodeName] = attr.nodeValue;
          }
          str += JSON.stringify(attrs);
        } else {
          str += "{}";
        }

        str += ", [";
        if (item.childNodes && item.childNodes.length > 0) {
          str += `${domToHyperscript(item.childNodes, depth + 1)}\n${spaces}`;
        }

        str += `])`;
        return str;
      }
    })
    .join(",");
}

function htmlToHyperscript(html) {
  return `[${domToHyperscript(htmlToDom(html, { treeAdapter: TreeAdapter }))}\n]`;
}

class Node {
  constructor(nodeType, nodeName) {
    this.nodeType = nodeType;
    this.nodeName = toLower(nodeName);
    this.tagName = nodeName;
    this.childNodes = [];
    this.nodeValue = "";
  }
  appendChild(child) {
    child.remove();
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }
  insertBefore(child, ref) {
    child.remove();
    child.parentNode = this;
    if (ref) {
      let idx = this.childNodes.indexOf(ref);
      this.childNodes.splice(idx, 0, child);
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
      let idx = this.parentNode.childNodes.indexOf(this);
      this.parentNode.childNodes.splice(idx, 1);
      this.parentNode = null;
    }
  }
}

class Text extends Node {
  constructor(text) {
    super(3, "#text");
    this.node_value = String(text);
  }
  node_value = "";
  set textContent(text) {
    this.node_value = String(text);
  }
  get textContent() {
    return this.node_value;
  }
  set nodeValue(text) {
    this.node_value = String(text);
  }
  get nodeValue() {
    return this.node_value;
  }

  cloneNode() {
    return new Text(this.node_value);
  }
}

class Element extends Node {
  constructor(nodeType, nodeName) {
    super(nodeType || 1, nodeName);
    this.attributes = [];
    this.attachedListeners = {};
    let updateStyles = (state) => {
      let str = "";
      for (let key in state) {
        let value = state[key];
        if (typeof value !== "undefined" && value !== null && String(value).length > 0) {
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
    let attr = {
      nodeName: name,
      nodeValue: value
    };
    let idx = -1;
    for (let i = 0, l = this.attributes.length; i < l; i++) {
      if (this.attributes[i].nodeName === name) {
        idx = i;
        break;
      }
    }
    idx === -1 ? this.attributes.push(attr) : this.attributes.splice(idx, 1, attr);
  }

  getAttribute(name) {
    for (let i = 0, l = this.attributes.length; i < l; i++) {
      if (this.attributes[i].nodeName === name) {
        return this.attributes[i].nodeValue;
      }
    }
  }

  removeAttribute(name) {
    let idx = -1;
    for (let i = 0, l = this.attributes.length; i < l; i++) {
      if (this.attributes[i].nodeName === name) {
        idx = i;
        break;
      }
    }
    if (idx > -1) {
      this.attributes.splice(idx, 1);
    }
  }

  addEventListener(type, handler) {
    // (this.attachedListeners[toLower(type)] || (this.attachedListeners[toLower(type)] = [])).push(handler);
  }

  removeEventListener(type, handler) {
    // splice(this.attachedListeners[toLower(type)], handler, false, true);
  }

  // dispatchEvent(event) {
  //   let t = (event.target = this),
  //     c = event.cancelable,
  //     l,
  //     i;
  //   do {
  //     event.currentTarget = t;
  //     l = t.attachedListeners && t.attachedListeners[toLower(event.type)];
  //     if (l) {
  //       for (i = l.length; i--; ) {
  //         if ((l[i].call(t, event) === false || event._end) && c) {
  //           event.defaultPrevented = true;
  //         }
  //       }
  //     }
  //   } while (event.bubbles && !(c && event._stop) && (t = t.parentNode));
  //   return l !== null;
  // }

  set textContent(text) {
    this.nodeValue = String(text);
    this.childNodes = this.nodeValue ? [new Text(this.nodeValue)] : [];
  }
  get textContent() {
    return this.nodeValue;
  }

  set innerText(text) {
    this.nodeValue = String(text);
  }

  get innerText() {
    return this.nodeValue;
  }

  get innerHTML() {
    let str = "";
    for (let i = 0, l = this.childNodes.length; i < l; i++) {
      str += domToHtml(this.childNodes[i]);
    }
    return str;
  }

  set innerHTML(html) {
    this.textContent = "";
    let result = [...htmlToDom(html, { treeAdapter: TreeAdapter })];
    for (let i = 0, l = result.length; i < l; i++) {
      this.appendChild(result[i]);
    }
  }

  get outerHTML() {
    return domToHtml(this);
  }

  getElementById(id) {
    let elementFound;
    for (let i = 0, l = this.childNodes.length; i < l; i++) {
      if (this.childNodes[i].nodeType === 1) {
        if (this.childNodes[i].getAttribute("id") === id) {
          elementFound = this.childNodes[i];
          break;
        }
        elementFound = this.childNodes[i].getElementById(id);
        if (elementFound) {
          break;
        }
      }
    }
    return elementFound;
  }

  cloneNode(cloneChildren = true) {
    if (cloneChildren === false) {
      let element = new Element(this.nodeType, this.nodeName);

      for (let i = 0, l = this.attributes.length; i < l; i++) {
        element.setAttribute(this.attributes[i].nodeName, this.attributes[i].nodeValue);
      }

      return element;
    }

    let result = [...htmlToDom(this.outerHTML, { treeAdapter: TreeAdapter })];
    let element = result[0];

    element.childNodes = [];

    return element;
  }

  get firstChild() {
    return this.childNodes[0];
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1];
  }

  get nextSibling() {
    let idx = this.parentNode.childNodes.indexOf(this);
    return this.parentNode.childNodes[idx + 1];
  }

  get previousSibling() {
    let idx = this.parentNode.childNodes.indexOf(this);
    return this.parentNode.childNodes[idx - 1];
  }
}

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

const TreeAdapter = {
  parseAttributes,
  htmlToDom,
  domToHtml,
  domToHyperscript,
  htmlToHyperscript,
  createDocumentFragment() {
    return {
      nodeName: "#document-fragment",
      childNodes: []
    };
  },

  createElement(tagName, namespaceURI, attributes) {
    let element = new Element(1, tagName);
    element.tagName = tagName;
    element.attributes = parseAttributes(attributes);
    element.namespaceURI = namespaceURI;

    return element;
  },

  createCommentNode(data) {
    return {
      nodeName: "#comment",
      data,
      parentNode: null
    };
  },

  createTextNode(value) {
    let element = new Text(value);
    element.value = value;
    return element;
  },

  //Tree mutation
  appendChild(parentNode, newNode) {
    parentNode.childNodes.push(newNode);
    newNode.parentNode = parentNode;
  },

  insertBefore(parentNode, newNode, referenceNode) {
    const insertionIdx = parentNode.childNodes.indexOf(referenceNode);

    parentNode.childNodes.splice(insertionIdx, 0, newNode);
    newNode.parentNode = parentNode;
  },

  //Node construction
  createDocument() {
    let document = new Document();
    document.mode = DOCUMENT_MODE.NO_QUIRKS;
    return document;
  },

  setTemplateContent(templateElement, contentElement) {
    templateElement.content = contentElement;
  },

  getTemplateContent(templateElement) {
    return templateElement.content;
  },

  setDocumentType(document, name, publicId, systemId) {
    let doctypeNode = null;

    for (let i = 0; i < document.childNodes.length; i++) {
      if (document.childNodes[i].nodeName === "#documentType") {
        doctypeNode = document.childNodes[i];
        break;
      }
    }

    if (doctypeNode) {
      doctypeNode.name = name;
      doctypeNode.publicId = publicId;
      doctypeNode.systemId = systemId;
    } else {
      let element = new Element(10, "!DOCTYPE");
      element.nodeName = "!DOCTYPE";
      element.publicId = publicId;
      element.systemId = systemId;
      element.name = name;
      element.attributes = [{ nodeName: "html", nodeValue: true }];

      TreeAdapter.appendChild(document, element);
    }
  },

  setDocumentMode(document, mode) {
    document.mode = mode;
  },

  getDocumentMode(document) {
    return document.mode;
  },

  detachNode(node) {
    if (node.parentNode) {
      const idx = node.parentNode.childNodes.indexOf(node);

      node.parentNode.childNodes.splice(idx, 1);
      node.parentNode = null;
    }
  },

  insertText(parentNode, text) {
    if (parentNode.childNodes.length) {
      const prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];

      if (prevNode.nodeName === "#text") {
        prevNode.value += text;
        prevNode.nodeValue += text;
        return;
      }
    }

    TreeAdapter.appendChild(parentNode, TreeAdapter.createTextNode(text));
  },

  insertTextBefore(parentNode, text, referenceNode) {
    const prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];

    if (prevNode && prevNode.nodeName === "#text") {
      prevNode.value += text;
      prevNode.nodeValue += text;
    } else {
      TreeAdapter.insertBefore(parentNode, TreeAdapter.createTextNode(text), referenceNode);
    }
  },

  adoptAttributes(recipient, attributes) {
    const recipientAttrsMap = [];

    for (let i = 0; i < recipient.attributes.length; i++) {
      recipientAttrsMap.push(recipient.attributes[i].name);
    }

    for (let j = 0; j < attributes.length; j++) {
      if (recipientAttrsMap.indexOf(attributes[j].name) === -1) {
        recipient.attributes.push(attributes[j]);
      }
    }
  },

  //Tree traversing
  getFirstChild(node) {
    return node.childNodes[0];
  },

  getChildNodes(node) {
    return node.childNodes;
  },

  getParentNode(node) {
    return node.parentNode;
  },

  getAttrList(element) {
    return element.attributes;
  },

  //Node data
  getTagName(element) {
    return element.tagName;
  },

  getNamespaceURI(element) {
    return element.namespaceURI;
  },

  getTextNodeContent(textNode) {
    return textNode.value;
  },

  getCommentNodeContent(commentNode) {
    return commentNode.data;
  },

  getDocumentTypeNodeName(doctypeNode) {
    return doctypeNode.name;
  },

  getDocumentTypeNodePublicId(doctypeNode) {
    return doctypeNode.publicId;
  },

  getDocumentTypeNodeSystemId(doctypeNode) {
    return doctypeNode.systemId;
  },

  //Node types
  isTextNode(node) {
    return node.nodeName === "#text";
  },

  isCommentNode(node) {
    return node.nodeName === "#comment";
  },

  isDocumentTypeNode(node) {
    return node.nodeName === "#documentType";
  },

  isElementNode(node) {
    return !!node.tagName;
  },

  // Source code location
  setNodeSourceCodeLocation(node, location) {
    node.sourceCodeLocation = location;
  },

  getNodeSourceCodeLocation(node) {
    return node.sourceCodeLocation;
  }
};

TreeAdapter.default = TreeAdapter;
module.exports = TreeAdapter;
