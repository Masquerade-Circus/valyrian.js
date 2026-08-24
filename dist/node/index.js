"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/node/index.ts
var index_exports = {};
__export(index_exports, {
  Document: () => Document,
  DocumentFragment: () => DocumentFragment,
  Element: () => Element,
  Event: () => Event,
  HTMLFormElement: () => HTMLFormElement,
  MouseEvent: () => MouseEvent,
  Node: () => Node,
  NodeRuntime: () => NodeRuntime,
  PopStateEvent: () => PopStateEvent,
  ServerStorage: () => ServerStorage,
  SubmitEvent: () => SubmitEvent,
  document: () => document2,
  domToHtml: () => domToHtml,
  domToHyperscript: () => domToHyperscript,
  htmlToDom: () => htmlToDom,
  htmlToHyperscript: () => htmlToHyperscript,
  icons: () => icons,
  inline: () => inline,
  render: () => render,
  sw: () => sw
});
module.exports = __toCommonJS(index_exports);

// lib/utils/validators.ts
function is(value, type) {
  if (typeof type !== "string") {
    return value instanceof type;
  }
  if (type === "array") {
    return Array.isArray(value);
  }
  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (type === "number") {
    return typeof value === "number" && !isNaN(value);
  }
  return typeof value === type;
}
function isString(value) {
  return is(value, "string");
}

// lib/node/utils/tree-adapter.ts
var Event = class {
  constructor(type, options = {}) {
    this.type = type;
    this.options = options;
    this.bubbles = options.bubbles ?? false;
    this.cancelable = options.cancelable ?? false;
  }
  type;
  options;
  propagationPath = [];
  bubbles = false;
  NONE = 0;
  CAPTURING_PHASE = 1;
  AT_TARGET = 2;
  BUBBLING_PHASE = 3;
  cancelBubble = false;
  cancelable = false;
  composed = false;
  defaultPrevented = false;
  eventPhase = 0;
  isTrusted = false;
  propagationStopped = false;
  returnValue = true;
  srcElement = null;
  target = null;
  currentTarget = null;
  timeStamp = Date.now();
  composedPath() {
    return [...this.propagationPath];
  }
  initEvent(type, bubbles = false, cancelable = false) {
    this.type = type;
    this.bubbles = bubbles;
    this.cancelable = cancelable;
  }
  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
      this.returnValue = false;
    }
  }
  stopPropagation() {
    this.propagationStopped = true;
    this.cancelBubble = true;
  }
  stopImmediatePropagation() {
    this.propagationStopped = true;
  }
};
var MouseEvent = class extends Event {
  button;
  buttons;
  ctrlKey;
  metaKey;
  shiftKey;
  altKey;
  constructor(type, options = {}) {
    super(type, options);
    this.button = options.button ?? 0;
    this.buttons = options.buttons ?? 0;
    this.ctrlKey = options.ctrlKey ?? false;
    this.metaKey = options.metaKey ?? false;
    this.shiftKey = options.shiftKey ?? false;
    this.altKey = options.altKey ?? false;
  }
};
var SubmitEvent = class extends Event {
  submitter;
  constructor(type, options = {}) {
    super(type, options);
    this.submitter = options.submitter ?? null;
  }
};
var PopStateEvent = class extends Event {
  state;
  constructor(type, options = {}) {
    super(type, options);
    this.state = options.state ?? null;
  }
};
var Node = class _Node {
  // eslint-disable-next-line no-use-before-define
  childNodes = [];
  baseURI = "";
  tag_name;
  dispatchEvent(event) {
    if (!(event instanceof Event)) {
      return true;
    }
    const eventState = event;
    if (!event.target) {
      event.target = this;
      eventState.propagationPath = [];
    }
    event.currentTarget = this;
    eventState.propagationPath.push(this);
    if (this instanceof Element) {
      const listeners = this._listeners?.get(event.type);
      if (listeners) {
        for (const handler of listeners) {
          if (event.propagationStopped) break;
          handler.call(this, event);
        }
      }
      if (event.bubbles && !event.propagationStopped && this.parentNode) {
        this.parentNode.dispatchEvent(event);
      }
    }
    return !event.defaultPrevented;
  }
  _dispatchEvent(event) {
    return this.dispatchEvent(event);
  }
  get nodeName() {
    return this.tag_name;
  }
  set nodeName(name) {
    this.tag_name = name;
  }
  get tagName() {
    return this.tag_name;
  }
  set tagName(name) {
    this.tag_name = name;
  }
  node_type;
  get nodeType() {
    return this.node_type;
  }
  set nodeType(type) {
    this.node_type = type;
  }
  node_value = "";
  attributes = [];
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
  // eslint-disable-next-line no-use-before-define
  parent_node = null;
  get parentNode() {
    return this.parent_node;
  }
  set parentNode(node) {
    this.parent_node = node;
  }
  get parentElement() {
    return this.parentNode instanceof Element ? this.parentNode : null;
  }
  set parentElement(node) {
    this.parentNode = node;
  }
  #dataset = {};
  get dataset() {
    return this.#dataset;
  }
  set dataset(value) {
    this.#dataset = value;
  }
  constructor() {
  }
  appendChild(node) {
    if (node instanceof DocumentFragment) {
      return this.insertBefore(node, null);
    }
    if (node) {
      node.parentNode && node.parentNode.removeChild(node);
      this.childNodes.push(node);
      node.parentNode = this;
      node.parentElement = this instanceof Element ? this : null;
    }
    return node;
  }
  insertBefore(node, child) {
    if (node instanceof DocumentFragment) {
      const children = Array.from(node.childNodes);
      for (const fragmentChild of children) {
        this.insertBefore(fragmentChild, child);
      }
      return node;
    }
    if (node) {
      node.parentNode && node.parentNode.removeChild(node);
      node.parentNode = this;
      node.parentElement = this instanceof Element ? this : null;
      if (child) {
        const idx = this.childNodes.indexOf(child);
        this.childNodes.splice(idx, 0, node);
      } else {
        this.childNodes.push(node);
      }
    }
    return node;
  }
  replaceChild(node, child) {
    if (node && child && child.parentNode === this) {
      this.insertBefore(node, child);
      child.parentNode && child.parentNode.removeChild(child);
    }
    return child;
  }
  removeChild(child) {
    if (child && child.parentNode === this) {
      const idx = this.childNodes.indexOf(child);
      this.childNodes.splice(idx, 1);
      child.parentNode = null;
      child.parentElement = null;
    }
    return child;
  }
  remove() {
    return this.parentNode ? this.parentNode.removeChild(this) : this;
  }
  cloneNode(deep) {
    if (this.nodeType === 3) {
      return new Text(this.nodeValue);
    }
    if (this.nodeType === 1) {
      const node2 = new Element();
      node2.nodeType = this.nodeType;
      node2.nodeName = this.nodeName;
      if (this.attributes) {
        for (let i = 0, l = this.attributes.length; i < l; i++) {
          node2.setAttribute(this.attributes[i].nodeName, this.attributes[i].nodeValue);
        }
      }
      for (const key in this.dataset) {
        node2.dataset[key] = this.dataset[key];
      }
      if (deep) {
        for (let i = 0, l = this.childNodes.length; i < l; i++) {
          node2.appendChild(this.childNodes[i].cloneNode(deep));
        }
      }
      return node2;
    }
    const node = new _Node();
    node.nodeType = this.nodeType;
    node.nodeName = this.nodeName;
    return node;
  }
  setAttribute(name, value) {
    const attr = {
      nodeName: name,
      nodeValue: String(value)
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
        return String(this.attributes[i].nodeValue);
      }
    }
    return null;
  }
  hasAttribute(name) {
    for (let index = 0; index < this.attributes.length; index++) {
      if (this.attributes[index].nodeName === name) {
        return true;
      }
    }
    return false;
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
  // Not implemented
  // firstChild!: ChildNode | null;
  // isConnected!: boolean;
  // lastChild!: ChildNode | null;
  // nextSibling!: ChildNode | null;
  // ownerDocument!: Document | null;
  // parentElement!: HTMLElement | null;
  // previousSibling!: ChildNode | null;
  // compareDocumentPosition(other: Node): number {
  //   throw new Error("Method not implemented.");
  // }
  // contains(other: Node | null): boolean {
  //   throw new Error("Method not implemented.");
  // }
  // getRootNode(options?: GetRootNodeOptions | undefined): Node {
  //   throw new Error("Method not implemented.");
  // }
  // hasChildNodes(): boolean {
  //   throw new Error("Method not implemented.");
  // }
  // isDefaultNamespace(namespace: string | null): boolean {
  //   throw new Error("Method not implemented.");
  // }
  // isEqualNode(otherNode: Node | null): boolean {
  //   throw new Error("Method not implemented.");
  // }
  // isSameNode(otherNode: Node | null): boolean {
  //   throw new Error("Method not implemented.");
  // }
  // lookupNamespaceURI(prefix: string | null): string | null {
  //   throw new Error("Method not implemented.");
  // }
  // lookupPrefix(namespace: string | null): string | null {
  //   throw new Error("Method not implemented.");
  // }
  // normalize(): void {
  //   throw new Error("Method not implemented.");
  // }
  // ATTRIBUTE_NODE!: number;
  // CDATA_SECTION_NODE!: number;
  // COMMENT_NODE!: number;
  // DOCUMENT_FRAGMENT_NODE!: number;
  // DOCUMENT_NODE!: number;
  // DOCUMENT_POSITION_CONTAINED_BY!: number;
  // DOCUMENT_POSITION_CONTAINS!: number;
  // DOCUMENT_POSITION_DISCONNECTED!: number;
  // DOCUMENT_POSITION_FOLLOWING!: number;
  // DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC!: number;
  // DOCUMENT_POSITION_PRECEDING!: number;
  // DOCUMENT_TYPE_NODE!: number;
  // ELEMENT_NODE!: number;
  // ENTITY_NODE!: number;
  // ENTITY_REFERENCE_NODE!: number;
  // NOTATION_NODE!: number;
  // PROCESSING_INSTRUCTION_NODE!: number;
  // TEXT_NODE!: number;
  addEventListener(type, callback, options) {
  }
  // dispatchEvent(event: Event): boolean {
  //   throw new Error("Method not implemented.");
  // }
  removeEventListener(type, callback, options) {
  }
};
var Text = class extends Node {
  constructor(text) {
    super();
    this.nodeType = 3;
    this.nodeName = "#text";
    this.node_value = String(text);
  }
};
function updateElementStyles(element, state) {
  let str = "";
  for (const key in state) {
    const value = state[key];
    if (typeof value !== "undefined" && value !== null && String(value).length > 0) {
      str += `${key}: ${state[key]};`;
    }
  }
  if (str.length === 0) {
    element.removeAttribute("style");
  } else {
    element.setAttribute("style", str);
  }
}
var Element = class extends Node {
  #listeners = /* @__PURE__ */ new Map();
  #objectListeners = /* @__PURE__ */ new WeakMap();
  get _listeners() {
    return this.#listeners;
  }
  #value = "";
  #checked = false;
  constructor() {
    super();
    this.nodeType = 1;
    this.attributes = [];
    this.childNodes = [];
  }
  get value() {
    if (this.#value.length > 0) {
      return this.#value;
    }
    const attributeValue = this.getAttribute("value");
    return attributeValue == null ? "" : String(attributeValue);
  }
  set value(val) {
    this.#value = String(val);
    if (this.#value.length === 0) {
      this.removeAttribute("value");
      return;
    }
    this.setAttribute("value", this.#value);
  }
  get checked() {
    return this.#checked || Boolean(this.getAttribute("checked"));
  }
  set checked(val) {
    this.#checked = Boolean(val);
    if (this.#checked) {
      this.setAttribute("checked", true);
    } else {
      this.removeAttribute("checked");
    }
  }
  addEventListener(type, callback, _options) {
    if (!callback) return;
    let handler;
    if (typeof callback === "function") {
      handler = callback;
    } else {
      handler = this.#objectListeners.get(callback);
      if (!handler) {
        handler = (event) => callback.handleEvent(event);
        this.#objectListeners.set(callback, handler);
      }
    }
    if (!handler) return;
    let listeners = this.#listeners.get(type);
    if (!listeners) {
      listeners = /* @__PURE__ */ new Set();
      this.#listeners.set(type, listeners);
    }
    listeners.add(handler);
  }
  removeEventListener(type, callback, _options) {
    if (!callback) return;
    const handler = typeof callback === "function" ? callback : this.#objectListeners.get(callback);
    if (!handler) return;
    const listeners = this.#listeners.get(type);
    if (listeners?.delete(handler) && listeners.size === 0) {
      this.#listeners.delete(type);
    }
  }
  _style = new Proxy(
    {},
    {
      get: (state, prop) => state[prop],
      set: (state, prop, value) => {
        state[prop] = value;
        updateElementStyles(this, state);
        return true;
      },
      deleteProperty: (state, prop) => {
        Reflect.deleteProperty(state, prop);
        updateElementStyles(this, state);
        return true;
      }
    }
  );
  get style() {
    return this._style;
  }
  set style(value) {
    if (isString(value)) {
      const regex = /([^:\s]+):\s*((url\([^)]+\))|[^;]+(?=(;|$)))/g;
      let match;
      while ((match = regex.exec(value)) !== null) {
        this._style[match[1]] = match[2].trim();
      }
      return;
    }
    throw new Error("Cannot set style");
  }
  get className() {
    return this.getAttribute("class") || "";
  }
  set className(value) {
    if (value == null || value === false) {
      this.removeAttribute("class");
    } else {
      this.setAttribute("class", String(value));
    }
  }
  classList = {
    toggle: (item, force) => {
      if (item) {
        const classes = (this.className || "").split(" ");
        const itemIndex = classes.indexOf(item);
        if (force && itemIndex === -1) {
          classes.push(item);
        }
        if (!force && itemIndex !== -1) {
          classes.splice(itemIndex, 1);
        }
        const final = classes.join(" ").trim();
        if (final.length) {
          this.className = classes.join(" ").trim();
        } else {
          this.className = false;
        }
      }
    }
  };
  get id() {
    return this.getAttribute("id") || "";
  }
  set id(value) {
    if (value == null || value === false) {
      this.removeAttribute("id");
    } else {
      this.setAttribute("id", String(value));
    }
  }
  set textContent(text) {
    this.nodeValue = String(text);
    this.childNodes = this.nodeValue ? [new Text(this.nodeValue)] : [];
  }
  get textContent() {
    const { childNodes } = this;
    if (childNodes.length === 0) {
      return this.nodeValue;
    }
    let text = "";
    for (let i = 0, l = childNodes.length; i < l; i++) {
      text += childNodes[i].textContent || childNodes[i].nodeValue || "";
    }
    return text;
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
    if (html.length === 0) {
      return;
    }
    const result = htmlToDom(html);
    if (result instanceof DocumentFragment) {
      const children = Array.from(result.childNodes);
      for (const child of children) {
        this.appendChild(child);
      }
    } else {
      this.appendChild(result);
    }
  }
  get outerHTML() {
    return domToHtml(this);
  }
  querySelector(selector) {
    return querySelectorWithin(this, selector, 1)[0] ?? null;
  }
  querySelectorAll(selector) {
    return querySelectorWithin(this, selector);
  }
  click() {
    const tag = this.nodeName.toLowerCase();
    if ((tag === "button" || tag === "input") && this.hasAttribute("disabled")) {
      return;
    }
    this.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  }
};
var HTMLFormElement = class extends Element {
  requestSubmit(submitter = null) {
    this.dispatchEvent(
      new SubmitEvent("submit", {
        bubbles: true,
        cancelable: true,
        submitter
      })
    );
  }
};
var DocumentFragment = class extends Element {
  constructor() {
    super();
    this.nodeType = 11;
    this.nodeName = "#document-fragment";
  }
};
var Document = class extends Element {
  constructor() {
    super();
    this.nodeType = 9;
    this.nodeName = "#document";
    this.documentElement = this.createElement("html");
    this.head = this.createElement("head");
    this.body = this.createElement("body");
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.appendChild(this.documentElement);
  }
  documentElement;
  head;
  body;
  location;
  getElementById(id) {
    const stack = Array.from(this.childNodes).reverse();
    while (stack.length > 0) {
      const node = stack.pop();
      if (!(node instanceof Element)) {
        continue;
      }
      if (node.getAttribute("id") === id) {
        return node;
      }
      for (let index = node.childNodes.length - 1; index >= 0; index--) {
        stack.push(node.childNodes[index]);
      }
    }
    return null;
  }
  createDocumentFragment() {
    return new DocumentFragment();
  }
  createElement(type) {
    const element = type.toLowerCase() === "form" ? new HTMLFormElement() : new Element();
    element.nodeName = type.toUpperCase();
    return element;
  }
  createElementNS(ns, type) {
    const element = this.createElement(type);
    element.baseURI = ns;
    return element;
  }
  createTextNode(text) {
    return new Text(text);
  }
};
function parseSimpleSelector(selector) {
  const match = selector.match(
    /^(?:([A-Za-z][A-Za-z0-9-]*))?(?:(#[A-Za-z_][A-Za-z0-9_-]*)|(\.[A-Za-z_][A-Za-z0-9_-]*)|\[([A-Za-z_][A-Za-z0-9_-]*)(?:="([^"]*)")?\])?$/
  );
  if (!match || !match[1] && !match[2] && !match[3] && !match[4]) {
    throw new SyntaxError(`Unsupported selector: ${selector}`);
  }
  return {
    tag: match[1]?.toLowerCase() ?? null,
    id: match[2]?.slice(1) ?? null,
    className: match[3]?.slice(1) ?? null,
    attribute: match[4] ?? null,
    attributeValue: typeof match[5] === "string" ? match[5] : null
  };
}
function parseSelector(selector) {
  if (selector.trim() !== selector || selector.length === 0 || /\s{2,}/.test(selector)) {
    throw new SyntaxError(`Unsupported selector: ${selector}`);
  }
  return selector.split(" ").map(parseSimpleSelector);
}
function matchesSimpleSelector(element, selector) {
  if (selector.tag && element.nodeName.toLowerCase() !== selector.tag) {
    return false;
  }
  if (selector.id && element.id !== selector.id) {
    return false;
  }
  if (selector.className && !element.className.split(/\s+/).includes(selector.className)) {
    return false;
  }
  if (selector.attribute) {
    const attributeValue = element.getAttribute(selector.attribute);
    if (attributeValue === null) {
      return false;
    }
    if (selector.attributeValue !== null) {
      return attributeValue === selector.attributeValue;
    }
  }
  return true;
}
function querySelectorWithin(root, selector, limit = Number.POSITIVE_INFINITY) {
  const parts = parseSelector(selector);
  const targetSelector = parts[parts.length - 1];
  const matches = [];
  const stack = Array.from(root.childNodes).reverse();
  while (stack.length > 0) {
    const node = stack.pop();
    if (!(node instanceof Element)) {
      continue;
    }
    if (matchesSimpleSelector(node, targetSelector)) {
      let ancestor = node.parentElement;
      let partIndex = parts.length - 2;
      while (partIndex >= 0 && ancestor) {
        if (matchesSimpleSelector(ancestor, parts[partIndex])) {
          partIndex--;
        }
        ancestor = ancestor.parentElement;
      }
      if (partIndex < 0) {
        matches.push(node);
        if (matches.length === limit) {
          return matches;
        }
      }
    }
    for (let index = node.childNodes.length - 1; index >= 0; index--) {
      stack.push(node.childNodes[index]);
    }
  }
  return matches;
}
var ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  '"': "&quot;",
  "'": "&#39;"
};
var ESCAPE_REGEX = /[&><"']/g;
function escapeHtml(str) {
  if (typeof str !== "string") {
    return String(str);
  }
  if (ESCAPE_REGEX.test(str) === false) {
    return str;
  }
  return str.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]).replace(/&amp;amp;/g, "&amp;");
}
var selfClosingTags = [
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
var rawTextTags = ["script", "style"];
function domToHtml(dom, rawText = false) {
  if (dom.nodeType === 3) {
    return rawText ? dom.textContent : escapeHtml(dom.textContent);
  }
  if (dom.nodeType === 1) {
    const name = dom.nodeName.toLowerCase();
    let str = "<" + name;
    for (let i = 0, l = dom.attributes.length; i < l; i++) {
      const attr = dom.attributes[i];
      str += " " + attr.nodeName + '="' + escapeHtml(attr.nodeValue) + '"';
    }
    if (selfClosingTags.indexOf(name) === -1) {
      str += ">";
      if (dom.childNodes && dom.childNodes.length > 0) {
        for (let i = 0, l = dom.childNodes.length; i < l; i++) {
          const child = domToHtml(dom.childNodes[i], rawTextTags.includes(name));
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
  return "";
}
function domToHyperscript(childNodes, depth = 1) {
  let spaces = "";
  for (let i = 0; i < depth; i++) {
    spaces += "  ";
  }
  return childNodes.map((item) => {
    if (item.nodeType === 10) {
      return `
${spaces}"<!DOCTYPE html>"`;
    } else if (item.nodeType === 3) {
      return `
${spaces}"${item.nodeValue}"`;
    } else {
      let str = `
${spaces}v("${item.nodeName.toLowerCase()}", `;
      if (item.attributes) {
        const attrs = {};
        for (let i = 0, l = item.attributes.length; i < l; i++) {
          const attr = item.attributes[i];
          attrs[attr.nodeName] = attr.nodeValue;
        }
        str += JSON.stringify(attrs);
      } else {
        str += "{}";
      }
      str += ", [";
      if (item.childNodes && item.childNodes.length > 0) {
        str += `${domToHyperscript(item.childNodes, depth + 1)}
${spaces}`;
      }
      str += `])`;
      return str;
    }
  }).join(",");
}
var MAX_HTML_PARSER_DEPTH = 15e3;
var MAX_HTML_PARSER_NODES = 1e5;
function assertParserDepth(depth) {
  if (depth > MAX_HTML_PARSER_DEPTH) {
    throw new Error("HTML input exceeds maximum parser depth");
  }
}
function assertParserNodes(nodes) {
  if (nodes > MAX_HTML_PARSER_NODES) {
    throw new Error("HTML input exceeds maximum parser nodes");
  }
}
function createTextIndexItem(startsAt, endsAt, nodeValue) {
  return {
    tagName: "#text",
    startsAt,
    endsAt,
    contentStartsAt: startsAt,
    contentEndsAt: endsAt,
    attributes: {},
    children: [],
    nodeValue
  };
}
function findTexts(item, html) {
  const stack = [item];
  while (stack.length) {
    const current = stack.pop();
    const originalChildren = current.children;
    const newChildren = [];
    if (originalChildren.length) {
      for (let i = 0; i < originalChildren.length; i++) {
        const child = originalChildren[i];
        const nextChild = originalChildren[i + 1];
        if (i === 0 && child.startsAt > current.contentStartsAt) {
          const childContent = html.substring(current.contentStartsAt, child.startsAt);
          newChildren.push(
            createTextIndexItem(current.contentStartsAt, current.contentStartsAt + childContent.length, childContent)
          );
        }
        newChildren.push(child);
        if (nextChild && child.endsAt < nextChild.startsAt) {
          const childContent = html.substring(child.endsAt, nextChild.startsAt);
          newChildren.push(createTextIndexItem(child.endsAt, child.endsAt + childContent.length, childContent));
        }
        if (!nextChild && child.endsAt < current.contentEndsAt) {
          const childContent = html.substring(child.endsAt, current.contentEndsAt);
          newChildren.push(createTextIndexItem(child.endsAt, current.contentEndsAt, childContent));
        }
      }
      for (let i = originalChildren.length - 1; i >= 0; i--) {
        stack.push(originalChildren[i]);
      }
    } else {
      const childContent = html.substring(current.contentStartsAt, current.contentEndsAt);
      if (childContent.length) {
        newChildren.push(createTextIndexItem(current.contentStartsAt, current.contentEndsAt, childContent));
      }
    }
    current.children = newChildren;
  }
}
function createDomNode(item) {
  if (item.tagName === "#text") {
    return document.createTextNode(item.nodeValue);
  }
  const node = item.tagName === "#document-fragment" ? document.createDocumentFragment() : document.createElement(item.tagName);
  for (const key in item.attributes) {
    node.setAttribute(key, item.attributes[key]);
  }
  return node;
}
function convertToDom(item) {
  const node = createDomNode(item);
  const stack = item.children.map((child) => ({ item: child, parent: node })).reverse();
  while (stack.length) {
    const current = stack.pop();
    const childNode = createDomNode(current.item);
    current.parent.appendChild(childNode);
    for (let i = current.item.children.length - 1; i >= 0; i--) {
      stack.push({ item: current.item.children[i], parent: childNode });
    }
  }
  return node;
}
function getObjectIndexTree(html) {
  let item;
  const regex = RegExp("<([^>|^!]+)>", "g");
  const items = [];
  const openItems = [];
  let nodeCount = 0;
  while (item = regex.exec(html)) {
    if (item[0].startsWith("</")) {
      const lastOpenedItem = openItems.pop();
      if (lastOpenedItem) {
        lastOpenedItem.endsAt = item.index + item[0].length;
        lastOpenedItem.contentEndsAt = item.index;
        const parent = openItems[openItems.length - 1];
        if (parent) {
          parent.children.push(lastOpenedItem);
        } else {
          items.push(lastOpenedItem);
        }
      }
      continue;
    }
    const element = {
      tagName: item[1].split(" ")[0],
      startsAt: item.index,
      endsAt: null,
      contentStartsAt: item.index + item[0].length,
      contentEndsAt: null,
      attributes: {},
      children: [],
      nodeValue: null
    };
    nodeCount++;
    assertParserNodes(nodeCount);
    let string = (item[1] || "").substring(element.tagName.length + 1).replace(/\/$/g, "");
    const attributesWithValues = string.match(/\S+="[^"]+"/g);
    if (attributesWithValues) {
      for (const attribute of attributesWithValues) {
        const [name, ...value] = attribute.trim().split("=");
        string = string.replace(attribute, "");
        if (value) {
          element.attributes[name] = value.join("=").replace(/(^"|"$)/g, "");
        }
      }
    }
    const attributesWithBooleanValues = string.match(/\s\S+=[^"]+/g);
    if (attributesWithBooleanValues) {
      for (const attribute of attributesWithBooleanValues) {
        const [name, ...value] = attribute.trim().split("=");
        string = string.replace(attribute, "");
        if (value) {
          element.attributes[name] = value.join("=").replace(/(^"|"$)/g, "");
        }
      }
    }
    const attributesWithEmptyValues = string.match(/\s?\S+/g);
    if (attributesWithEmptyValues) {
      for (const attribute of attributesWithEmptyValues) {
        const name = attribute.trim();
        element.attributes[name] = true;
      }
    }
    if (item[0].endsWith("/>")) {
      assertParserDepth(openItems.length + 1);
      element.endsAt = element.startsAt + item[0].length;
      element.contentStartsAt = element.contentEndsAt = element.endsAt;
      const parent = openItems[openItems.length - 1];
      if (parent) {
        parent.children.push(element);
        continue;
      }
    }
    if (item[0].endsWith("/>")) {
      items.push(element);
    } else {
      assertParserDepth(openItems.length + 1);
      openItems.push(element);
    }
  }
  while (openItems.length) {
    const openItem = openItems.pop();
    openItem.endsAt = html.length;
    openItem.contentEndsAt = html.length;
    const parent = openItems[openItems.length - 1];
    if (parent) {
      parent.children.push(openItem);
    } else {
      items.push(openItem);
    }
  }
  const fragmentItem = {
    tagName: "#document-fragment",
    startsAt: 0,
    endsAt: html.length,
    contentStartsAt: 0,
    contentEndsAt: html.length,
    attributes: {},
    children: items,
    nodeValue: null
  };
  findTexts(fragmentItem, html);
  return convertToDom(fragmentItem);
}
function htmlToDom(html) {
  const openingTag = html.match(/<[^>]+>/g);
  const document3 = new Document();
  if (!openingTag) {
    const documentFragment = document3.createDocumentFragment();
    documentFragment.appendChild(document3.createTextNode(html));
    return documentFragment;
  }
  const fragment = getObjectIndexTree(html);
  if (fragment.childNodes.length > 1) {
    return fragment;
  }
  return fragment.childNodes[0];
}
function htmlToHyperscript(html) {
  const domTree = htmlToDom(html);
  const hyperscript = domToHyperscript(domTree instanceof DocumentFragment ? domTree.childNodes : [domTree]);
  return `[${hyperscript}
]`;
}
var document = new Document();

// lib/node/index.ts
var import_valyrian = require("valyrian.js");
var import_form_data = __toESM(require("form-data"));

// lib/node/utils/icons.ts
var import_fs = __toESM(require("fs"));
async function icons(source, configuration) {
  const options = {
    ...icons.options,
    ...configuration || {}
  };
  if (options.iconsPath) {
    options.iconsPath = options.iconsPath.replace(/\/$/gi, "") + "/";
  }
  if (options.linksViewPath) {
    options.linksViewPath = options.linksViewPath.replace(/\/$/gi, "") + "/";
  }
  const { favicons } = await import("favicons");
  try {
    const response = await favicons(source, options);
    if (options.iconsPath) {
      for (const i in response.images) {
        import_fs.default.writeFileSync(options.iconsPath + response.images[i].name, response.images[i].contents);
      }
      for (const i in response.files) {
        import_fs.default.writeFileSync(options.iconsPath + response.files[i].name, response.files[i].contents);
      }
    }
    if (options.linksViewPath) {
      const hyperscriptLinks = response.html.map((item) => {
        const hyperscript = htmlToHyperscript(item);
        return hyperscript.substring(1, hyperscript.length - 2);
      }).join(",");
      const jsxLinks = response.html.map((item) => `    ${item.endsWith("/>") ? item : item.replace(/>$/, " />")}`).join("\n");
      const html = `
  const { v } = require("valyrian.js");

  function Links(){
    return [${hyperscriptLinks}
  ];
  }
  
  Links.default = Links;
  module.exports = Links;
        `;
      const jsx = `/** @jsxImportSource valyrian.js */

export function Links() {
  return (
    <>
${jsxLinks}
    </>
  );
}
`;
      import_fs.default.writeFileSync(`${options.linksViewPath}/links.js`, html);
      import_fs.default.writeFileSync(`${options.linksViewPath}/links.jsx`, jsx);
      import_fs.default.writeFileSync(`${options.linksViewPath}/links.tsx`, jsx);
    }
  } catch (err) {
    process.stdout.write(err.status + "\n");
    process.stdout.write(err.name + "\n");
    process.stdout.write(err.message + "\n");
  }
}
icons.options = {
  iconsPath: null,
  linksViewPath: null,
  // favicons options
  path: "",
  appName: null,
  appDescription: null,
  developerName: null,
  developerURL: null,
  dir: "auto",
  lang: "en-US",
  background: "#fff",
  theme_color: "#fff",
  display: "standalone",
  orientation: "any",
  start_url: "/",
  version: "1.0",
  logging: false,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: true,
    coast: false,
    favicons: true,
    firefox: false,
    windows: true,
    yandex: false
    // Create Yandex browser icon. `boolean`
  }
};

// lib/node/utils/inline.ts
var tsc = __toESM(require("tsc-prog"));
var import_clean_css = __toESM(require("clean-css"));
var import_purgecss = require("purgecss");
var import_esbuild = __toESM(require("esbuild"));
var import_fs2 = __toESM(require("fs"));
async function inline(file, options = {}) {
  if (isString(file)) {
    const ext = file.split(".").pop();
    if (ext && /(js|cjs|jsx|mjs|ts|tsx)/.test(ext)) {
      if (/(ts|tsx)/.test(ext) && !options.noValidate) {
        const declarationDir = options.declarationDir;
        const emitDeclaration = !!declarationDir;
        const compilerOptions = {
          rootDir: "./",
          outDir: "dist",
          noEmitOnError: true,
          noEmit: !emitDeclaration,
          declaration: emitDeclaration,
          composite: emitDeclaration,
          declarationDir,
          emitDeclarationOnly: emitDeclaration,
          allowJs: true,
          esModuleInterop: true,
          inlineSourceMap: true,
          resolveJsonModule: true,
          removeComments: true,
          ...(options.tsc || {}).compilerOptions
        };
        const tscProgOptions = {
          basePath: process.cwd(),
          // always required, used for relative paths
          configFilePath: "tsconfig.json",
          // config to inherit from (optional)
          files: [file],
          include: [file],
          exclude: [],
          pretty: true,
          copyOtherToOutDir: false,
          clean: emitDeclaration ? [declarationDir] : [],
          ...options.tsc || {},
          compilerOptions
        };
        tsc.build(tscProgOptions);
      }
      const {
        bundle: _bundle,
        entryPoints: _entryPoints,
        jsx: _jsx,
        jsxImportSource: _jsxImportSource,
        loader: _loader,
        minify: _minify,
        outdir: _outdir,
        outfile: _outfile,
        sourcemap: _sourcemap,
        stdin: _stdin,
        write: _write,
        ...safeEsbuildOptions
      } = options.esbuild || {};
      const esbuildOptions = {
        ...safeEsbuildOptions,
        entryPoints: [file],
        bundle: "bundle" in options ? options.bundle : true,
        minify: options.compact,
        outdir: "out",
        target: "esnext",
        jsx: "automatic",
        jsxImportSource: "valyrian.js",
        loader: {
          ".js": "jsx",
          ".cjs": "jsx",
          ".mjs": "jsx",
          ".ts": "tsx"
        },
        sourcemap: "external",
        write: false
      };
      const result = await import_esbuild.default.build(esbuildOptions);
      if (result.outputFiles?.length !== 2) {
        throw new Error(result.errors.join("\n"));
      }
      if (options.compact) {
        const terser = await import("terser");
        const result2 = await terser.minify(result.outputFiles[1].text, {
          sourceMap: {
            content: result.outputFiles[0].text.toString()
          },
          compress: {
            booleans_as_integers: false
          },
          output: {
            wrap_func_args: false
          },
          ecma: 2022,
          ...options.terser || {}
        });
        if (!result2.code || !result2.map) {
          throw new Error("Unknown error");
        }
        const mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
        const suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result2.code, map: suffix, file };
      } else {
        const mapBase64 = Buffer.from(result.outputFiles[0].text.toString()).toString("base64");
        const suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result.outputFiles[1].text, map: suffix, file };
      }
    } else if (ext && /(css|scss|styl)/.test(ext)) {
      const result = await new import_clean_css.default({
        sourceMap: true,
        level: {
          1: {
            roundingPrecision: "all=3"
          },
          2: {
            restructureRules: true
            // controls rule restructuring; defaults to false
          }
        },
        ...options.cleanCss || {}
      }).minify([file]);
      return { raw: result.styles, map: null, file };
    } else {
      return { raw: import_fs2.default.readFileSync(file, "utf8"), map: null, file };
    }
  } else if (typeof file === "object" && "raw" in file) {
    return { map: null, ...file };
  }
  throw new Error(`Unknown file type: ${file}`);
}
inline.uncss = async function(renderedHtml, css, options = {}) {
  const html = await Promise.all(renderedHtml);
  const contents = html.map((item) => {
    return {
      raw: item,
      extension: "html"
    };
  });
  const purgecss = new import_purgecss.PurgeCSS();
  const output = await purgecss.purge({
    fontFace: true,
    keyframes: true,
    variables: true,
    defaultExtractor: (content) => content.match(/[A-Za-z0-9-_/:@]*[A-Za-z0-9-_/:@/]+/g) || [],
    ...options,
    content: contents,
    css: [{ raw: css }]
  });
  const cleanCss = await new import_clean_css.default({
    sourceMap: false,
    level: {
      1: {
        roundingPrecision: "all=3"
      },
      2: {
        restructureRules: true
        // controls rule restructuring; defaults to false
      }
    },
    ...options.cleanCss || {}
  }).minify(output[0].css);
  return cleanCss.styles;
};

// lib/node/utils/sw.ts
var import_fs3 = __toESM(require("fs"));
var import_path = __toESM(require("path"));
function sw(file, options = {}) {
  const swfiletemplate = import_path.default.resolve(__dirname, "./node.sw.js");
  const swTpl = import_fs3.default.readFileSync(swfiletemplate, "utf8");
  const criticalUrls = options.criticalUrls ?? options.urls ?? ["/"];
  const optionalUrls = options.optionalUrls ?? [];
  const opt = {
    version: options.version ?? "1",
    name: options.name ?? "Valyrian.js",
    criticalUrls,
    optionalUrls,
    debug: options.debug ?? false,
    logFetch: options.logFetch ?? false,
    offlinePage: options.offlinePage ?? "/offline.html"
  };
  let contents = swTpl.replace("v1", `v${opt.version}`).replace("Valyrian.js", opt.name).replace('criticalUrls: ["/"]', `criticalUrls: ${JSON.stringify(opt.criticalUrls)}`).replace("optionalUrls: []", `optionalUrls: ${JSON.stringify(opt.optionalUrls)}`).replace("/offline.html", opt.offlinePage).replace("logFetch: false", opt.logFetch ? "logFetch: true" : "logFetch: false");
  if (!opt.debug) {
    contents = contents.replace("console.log", "() => {}");
  }
  import_fs3.default.writeFileSync(file, contents, "utf8");
}

// lib/node/runtime.ts
var import_node_async_hooks = require("node:async_hooks");
var runtimeContext = new import_node_async_hooks.AsyncLocalStorage();
var assignedWindow;
var assignedLocation;
var assignedHistory;
function installRuntimeGlobals(publicDocument) {
  Object.defineProperties(globalThis, {
    document: {
      configurable: true,
      get: () => runtimeContext.getStore()?.document ?? publicDocument
    },
    window: {
      configurable: true,
      get: () => {
        const context = runtimeContext.getStore();
        return context ? context.browser ?? void 0 : assignedWindow;
      },
      set: (value) => {
        assignedWindow = value;
      }
    },
    location: {
      configurable: true,
      get: () => {
        const context = runtimeContext.getStore();
        return context ? context.browser?.location : assignedLocation;
      },
      set: (value) => {
        assignedLocation = value;
      }
    },
    history: {
      configurable: true,
      get: () => {
        const context = runtimeContext.getStore();
        return context ? context.browser?.history : assignedHistory;
      },
      set: (value) => {
        assignedHistory = value;
      }
    }
  });
}
var BrowserWindow = class {
  window = this;
  document;
  location;
  history;
  listeners = /* @__PURE__ */ new Map();
  constructor(document3, initialUrl) {
    this.document = document3;
    this.location = new BrowserLocation(initialUrl);
    this.history = new BrowserHistory(this, initialUrl);
    document3.location = this.location;
  }
  addEventListener(type, callback) {
    if (callback === null) {
      return;
    }
    let listeners = this.listeners.get(type);
    if (!listeners) {
      listeners = /* @__PURE__ */ new Set();
      this.listeners.set(type, listeners);
    }
    listeners.add(callback);
  }
  removeEventListener(type, callback) {
    if (callback === null) {
      return;
    }
    this.listeners.get(type)?.delete(callback);
  }
  dispatchEvent(event) {
    if (event.target === null) {
      event.target = this;
    }
    event.currentTarget = this;
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        if (event.propagationStopped) {
          break;
        }
        if (typeof callback === "function") {
          callback.call(this, event);
        } else {
          callback.handleEvent(event);
        }
      }
    }
    return !event.defaultPrevented;
  }
};
var BrowserLocation = class {
  url;
  constructor(url) {
    this.url = new URL(url.href);
  }
  get href() {
    return this.url.href;
  }
  get origin() {
    return this.url.origin;
  }
  get hostname() {
    return this.url.hostname;
  }
  get protocol() {
    return this.url.protocol;
  }
  get port() {
    return this.url.port;
  }
  get pathname() {
    return this.url.pathname;
  }
  get search() {
    return this.url.search;
  }
  get hash() {
    return this.url.hash;
  }
  setUrl(url) {
    this.url = url;
  }
};
var BrowserHistory = class {
  constructor(target, initialUrl) {
    this.target = target;
    this.initialUrl = new URL(initialUrl.href);
    this.entries = [{ url: this.initialUrl, state: null }];
  }
  target;
  entries;
  index = 0;
  initialUrl;
  get state() {
    return this.entries[this.index].state;
  }
  get length() {
    return this.entries.length;
  }
  pushState(state, _unused, url) {
    const nextUrl = this.resolveUrl(url);
    this.entries.splice(this.index + 1);
    this.entries.push({ url: nextUrl, state });
    this.index = this.entries.length - 1;
    this.target.location.setUrl(nextUrl);
  }
  replaceState(state, _unused, url) {
    const nextUrl = this.resolveUrl(url);
    this.entries[this.index] = { url: nextUrl, state };
    this.target.location.setUrl(nextUrl);
  }
  back() {
    this.go(-1);
  }
  forward() {
    this.go(1);
  }
  go(delta = 0) {
    if (!Number.isInteger(delta) || delta === 0) {
      return;
    }
    const nextIndex = this.index + delta;
    if (nextIndex < 0 || nextIndex >= this.entries.length) {
      return;
    }
    this.index = nextIndex;
    const entry = this.entries[this.index];
    this.target.location.setUrl(entry.url);
    this.target.dispatchEvent(new PopStateEvent("popstate", { state: entry.state }));
  }
  reset() {
    this.entries = [{ url: new URL(this.initialUrl.href), state: null }];
    this.index = 0;
    this.target.location.setUrl(this.initialUrl);
  }
  resolveUrl(url) {
    if (url === null || typeof url === "undefined") {
      return new URL(this.target.location.href);
    }
    const resolved = new URL(url, this.target.location.href);
    if (resolved.origin !== this.target.location.origin) {
      throw new DOMException("History state URL must keep the current origin", "SecurityError");
    }
    return resolved;
  }
};
function createRuntimeContext(browserUrl) {
  const document3 = new Document();
  return {
    document: document3,
    browser: browserUrl === null ? null : new BrowserWindow(document3, browserUrl),
    stores: /* @__PURE__ */ new Map()
  };
}
function runRuntimeContext(browserUrl, callback) {
  return runtimeContext.run(createRuntimeContext(browserUrl), callback);
}
function getActiveDocument(fallback) {
  return runtimeContext.getStore()?.document ?? fallback;
}
function getRuntimeStorage(storeKey) {
  const context = runtimeContext.getStore();
  if (!context) {
    return null;
  }
  let store = context.stores.get(storeKey);
  if (!store) {
    store = {};
    context.stores.set(storeKey, store);
  }
  return store;
}
function isRuntimeContextActive() {
  return Boolean(runtimeContext.getStore());
}
var NodeRuntime = class {
  static run(callback) {
    return runRuntimeContext(null, callback);
  }
  static runBrowser(options, callback) {
    return runRuntimeContext(new URL(options.url), callback);
  }
  static resetHistory() {
    const browser = runtimeContext.getStore()?.browser;
    if (browser === null || typeof browser === "undefined") {
      throw new Error("NodeRuntime.resetHistory() requires an active NodeRuntime.runBrowser() context");
    }
    browser.history.reset();
  }
};

// lib/node/utils/server-storage.ts
var ServerStorage = class {
  storeKey = /* @__PURE__ */ Symbol("server-storage");
  globalStore = {};
  isContextActive() {
    return isRuntimeContextActive();
  }
  get store() {
    return getRuntimeStorage(this.storeKey) ?? this.globalStore;
  }
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    const store = this.store;
    for (const key in store) {
      Reflect.deleteProperty(store, key);
    }
  }
  getItem(key) {
    const store = this.store;
    return key in store ? store[key] : null;
  }
  key(index) {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key) {
    Reflect.deleteProperty(this.store, key);
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  /**
   * @deprecated Use `NodeRuntime.run()` instead. This method may be removed in v10.
   */
  static run(callback) {
    return NodeRuntime.run(callback);
  }
  static isContextActive() {
    return isRuntimeContextActive();
  }
  toJSON() {
    return { ...this.store };
  }
};

// lib/node/index.ts
var document2 = new Proxy(document, {
  get(_target, property) {
    const activeDocument = getActiveDocument(document);
    const value = Reflect.get(activeDocument, property, activeDocument);
    if (property === "documentElement" && value instanceof Element) {
      if (value.parentNode !== document2) {
        value.parentNode = document2;
      }
      return value;
    }
    return typeof value === "function" ? value.bind(activeDocument) : value;
  },
  set(_target, property, value) {
    return Reflect.set(getActiveDocument(document), property, value);
  }
});
installRuntimeGlobals(document2);
global.FormData = import_form_data.default;
global.Event = Event;
global.MouseEvent = MouseEvent;
global.SubmitEvent = SubmitEvent;
global.PopStateEvent = PopStateEvent;
global.sessionStorage = new ServerStorage();
global.localStorage = new ServerStorage();
function render(...args) {
  const Component = () => args;
  const result = (0, import_valyrian.mount)(document2.createElement("div"), Component);
  (0, import_valyrian.unmount)();
  return result;
}
