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
var node_exports = {};
__export(node_exports, {
  domToHtml: () => domToHtml,
  domToHyperscript: () => domToHyperscript,
  htmlToDom: () => htmlToDom,
  htmlToHyperscript: () => htmlToHyperscript,
  icons: () => icons,
  inline: () => inline,
  render: () => render,
  sw: () => sw
});
module.exports = __toCommonJS(node_exports);

// lib/node/utils/tree-adapter.ts
var Node = class _Node {
  // eslint-disable-next-line no-use-before-define
  childNodes = [];
  baseURI = "";
  tag_name;
  get nodeName() {
    return this.tag_name.toLowerCase();
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
  constructor() {
  }
  appendChild(node) {
    if (node) {
      node.parentNode && node.parentNode.removeChild(node);
      this.childNodes.push(node);
      node.parentNode = this;
    }
    return node;
  }
  insertBefore(node, child) {
    if (node) {
      node.parentNode && node.parentNode.removeChild(node);
      node.parentNode = this;
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
    }
    return child;
  }
  cloneNode(deep) {
    if (this.nodeType === 3) {
      return new Text(this.nodeValue);
    }
    if (this.nodeType === 1) {
      const node2 = new Element();
      node2.nodeType = this.nodeType;
      this.nodeName = this.nodeName;
      if (this.attributes) {
        for (let i = 0, l = this.attributes.length; i < l; i++) {
          node2.setAttribute(this.attributes[i].nodeName, this.attributes[i].nodeValue);
        }
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
    return elementFound || null;
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
  constructor() {
    super();
    this.nodeType = 1;
    this.attributes = [];
    this.childNodes = [];
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
    if (typeof value === "string") {
      const regex = /([^:\s]+):\s*((url\([^)]+\))|[^;]+(?=(;|$)))/g;
      let match;
      while ((match = regex.exec(value)) !== null) {
        this._style[match[1]] = match[2].trim();
      }
      return;
    }
    throw new Error("Cannot set style");
  }
  classList = {
    toggle: (item, force) => {
      if (item) {
        const classes = (this.getAttribute("class") || "").split(" ");
        const itemIndex = classes.indexOf(item);
        if (force && itemIndex === -1) {
          classes.push(item);
        }
        if (!force && itemIndex !== -1) {
          classes.splice(itemIndex, 1);
        }
        const final = classes.join(" ").trim();
        if (final.length) {
          this.setAttribute("class", classes.join(" ").trim());
        } else {
          this.removeAttribute("class");
        }
      }
    }
  };
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
    const result = htmlToDom(html);
    if (result instanceof DocumentFragment) {
      for (let i = 0, l = result.childNodes.length; i < l; i++) {
        this.appendChild(result.childNodes[i]);
      }
    } else {
      this.appendChild(result);
    }
  }
  get outerHTML() {
    return domToHtml(this);
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
  }
  createDocumentFragment() {
    return new DocumentFragment();
  }
  createElement(type) {
    const element = new Element();
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
function domToHtml(dom) {
  if (dom.nodeType === 3) {
    return dom.textContent;
  }
  if (dom.nodeType === 1) {
    const name = dom.nodeName.toLowerCase();
    let str = "<" + name;
    for (let i = 0, l = dom.attributes.length; i < l; i++) {
      str += " " + dom.attributes[i].nodeName + '="' + dom.attributes[i].nodeValue + '"';
    }
    if (selfClosingTags.indexOf(name) === -1) {
      str += ">";
      if (dom.childNodes && dom.childNodes.length > 0) {
        for (let i = 0, l = dom.childNodes.length; i < l; i++) {
          const child = domToHtml(dom.childNodes[i]);
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
${spaces}v("${item.nodeName}", `;
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
function findTexts(item, html) {
  const newChildren = [];
  if (item.children.length) {
    for (let i = 0; i < item.children.length; i++) {
      const child = item.children[i];
      const nextChild = item.children[i + 1];
      if (i === 0 && child.startsAt > item.contentStartsAt) {
        const childContent = html.substring(item.contentStartsAt, child.startsAt);
        const childText = {
          tagName: "#text",
          startsAt: item.contentStartsAt,
          endsAt: item.contentStartsAt + childContent.length,
          contentStartsAt: item.contentStartsAt,
          contentEndsAt: item.contentStartsAt + childContent.length,
          attributes: {},
          children: [],
          nodeValue: childContent
        };
        newChildren.push(childText);
      }
      newChildren.push(child);
      if (nextChild && child.endsAt < nextChild.startsAt) {
        const childContent = html.substring(child.endsAt, nextChild.startsAt);
        const childText = {
          tagName: "#text",
          startsAt: child.endsAt,
          endsAt: child.endsAt + childContent.length,
          contentStartsAt: child.endsAt,
          contentEndsAt: child.endsAt + childContent.length,
          attributes: {},
          children: [],
          nodeValue: childContent
        };
        newChildren.push(childText);
      }
      if (!nextChild && child.endsAt < item.contentEndsAt) {
        const childContent = html.substring(child.endsAt, item.contentEndsAt);
        const childText = {
          tagName: "#text",
          startsAt: child.endsAt,
          endsAt: child.endsAt + childContent.length,
          contentStartsAt: child.endsAt,
          contentEndsAt: item.contentEndsAt,
          attributes: {},
          children: [],
          nodeValue: childContent
        };
        newChildren.push(childText);
      }
      findTexts(child, html);
    }
  }
  if (!item.children.length) {
    const childContent = html.substring(item.contentStartsAt, item.contentEndsAt);
    if (childContent.length) {
      const childText = {
        tagName: "#text",
        startsAt: item.contentStartsAt,
        endsAt: item.contentEndsAt,
        contentStartsAt: item.contentStartsAt,
        contentEndsAt: item.contentEndsAt,
        attributes: {},
        children: [],
        nodeValue: childContent
      };
      newChildren.push(childText);
    }
  }
  item.children = newChildren;
}
function convertToDom(item) {
  let node;
  if (item.tagName === "#text") {
    node = document.createTextNode(item.nodeValue);
  } else {
    node = item.tagName === "#document-fragment" ? document.createDocumentFragment() : document.createElement(item.tagName);
    for (const key in item.attributes) {
      node.setAttribute(key, item.attributes[key]);
    }
    for (let i = 0; i < item.children.length; i++) {
      const child = convertToDom(item.children[i]);
      node.appendChild(child);
    }
  }
  return node;
}
function getObjectIndexTree(html) {
  let item;
  const regex = RegExp("<([^>|^!]+)>", "g");
  const items = [];
  while (item = regex.exec(html)) {
    if (item[0].startsWith("</")) {
      const lastOpenedItem = [...items].reverse().find((item2) => item2.endsAt === null);
      if (lastOpenedItem) {
        lastOpenedItem.endsAt = item.index + item[0].length;
        lastOpenedItem.contentEndsAt = item.index;
        const parent = [...items].reverse().find((item2) => item2.endsAt === null);
        if (parent) {
          const index = items.indexOf(lastOpenedItem);
          items.splice(index, 1);
          parent.children.push(lastOpenedItem);
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
      element.endsAt = element.startsAt + item[0].length;
      element.contentStartsAt = element.contentEndsAt = element.endsAt;
      const parent = [...items].reverse().find((item2) => item2.endsAt === null);
      if (parent) {
        parent.children.push(element);
        continue;
      }
    }
    items.push(element);
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
  const document2 = new Document();
  if (!openingTag) {
    const documentFragment = document2.createDocumentFragment();
    documentFragment.appendChild(document2.createTextNode(html));
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
      const html = `
  function Links(){
    return ${htmlToHyperscript(response.html.join(""))};
  }
  
  Links.default = Links;
  module.exports = Links;
        `;
      import_fs.default.writeFileSync(`${options.linksViewPath}/links.js`, html);
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
  if (typeof file === "string") {
    const ext = file.split(".").pop();
    if (ext && /(js|cjs|jsx|mjs|ts|tsx)/.test(ext)) {
      if (/(ts|tsx)/.test(ext) && !options.noValidate) {
        const declarationDir = options.declarationDir;
        const emitDeclaration = !!declarationDir;
        const tscProgOptions = {
          basePath: process.cwd(),
          // always required, used for relative paths
          configFilePath: "tsconfig.json",
          // config to inherit from (optional)
          files: [file],
          include: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx", "**/*.mjs"],
          exclude: ["test*/**/*", "**/*.test.ts", "**/*.spec.ts", "dist/**"],
          pretty: true,
          copyOtherToOutDir: false,
          clean: emitDeclaration ? [declarationDir] : [],
          ...options.tsc || {},
          compilerOptions: {
            rootDir: "./",
            outDir: "dist",
            noEmitOnError: true,
            noEmit: !emitDeclaration,
            declaration: emitDeclaration,
            declarationDir,
            emitDeclarationOnly: emitDeclaration,
            allowJs: true,
            esModuleInterop: true,
            inlineSourceMap: true,
            resolveJsonModule: true,
            removeComments: true,
            ...(options.tsc || {}).compilerOptions
          },
          jsxFactory: "v",
          jsxFragment: "v.fragment"
        };
        console.log("tsc", tscProgOptions);
        tsc.build(tscProgOptions);
      }
      const esbuildOptions = {
        entryPoints: [file],
        bundle: "bundle" in options ? options.bundle : true,
        sourcemap: "external",
        write: false,
        minify: options.compact,
        outdir: "out",
        target: "esnext",
        jsxFactory: "v",
        jsxFragment: "v.fragment",
        loader: {
          ".js": "jsx",
          ".cjs": "jsx",
          ".mjs": "jsx",
          ".ts": "tsx"
        },
        ...options.esbuild || {}
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
  const swfiletemplate = import_path.default.resolve(__dirname, "./node.sw.tpl");
  const swTpl = import_fs3.default.readFileSync(swfiletemplate, "utf8");
  const opt = Object.assign(
    {
      version: "v1::",
      name: "Valyrian.js",
      urls: ["/"],
      debug: false
    },
    options
  );
  let contents = swTpl.replace("v1::", "v" + opt.version + "::").replace("Valyrian.js", opt.name).replace("['/']", '["' + opt.urls.join('","') + '"]');
  if (!opt.debug) {
    contents = contents.replace("console.log", "() => {}");
  }
  import_fs3.default.writeFileSync(file, contents, "utf8");
}

// lib/node/index.ts
global.FormData = import_form_data.default;
global.document = document;
function render(...args) {
  const Component = () => args;
  const result = (0, import_valyrian.mount)("div", Component);
  (0, import_valyrian.unmount)();
  return result;
}
