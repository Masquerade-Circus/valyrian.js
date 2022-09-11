import { fileURLToPath } from 'url';const __filename = fileURLToPath(import.meta.url);const __dirname = path.dirname(__filename);// lib/node/utils/tree-adapter.ts
var Node = class {
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
    node.parentNode && node.parentNode.removeChild(node);
    this.childNodes.push(node);
    node.parentNode = this;
    return node;
  }
  insertBefore(node, child) {
    node.parentNode && node.parentNode.removeChild(node);
    node.parentNode = this;
    if (child) {
      let idx = this.childNodes.indexOf(child);
      this.childNodes.splice(idx, 0, node);
    } else {
      this.childNodes.push(node);
    }
    return node;
  }
  replaceChild(node, child) {
    if (child && child.parentNode === this) {
      this.insertBefore(node, child);
      child.parentNode && child.parentNode.removeChild(child);
    }
    return child;
  }
  removeChild(child) {
    if (child && child.parentNode === this) {
      let idx = this.childNodes.indexOf(child);
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
      let node2 = new Element();
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
    let node = new Node();
    node.nodeType = this.nodeType;
    node.nodeName = this.nodeName;
    return node;
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
  addEventListener(type, callback, options) {
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
  for (let key in state) {
    let value = state[key];
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
  style = new Proxy(
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
  classList = {
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
    let result = htmlToDom(html);
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
    let element = new Element();
    element.nodeName = type.toUpperCase();
    return element;
  }
  createElementNS(ns, type) {
    let element = this.createElement(type);
    element.baseURI = ns;
    return element;
  }
  createTextNode(text) {
    return new Text(text);
  }
};
var selfClosingTags = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr", "!doctype"];
function domToHtml(dom) {
  if (dom.nodeType === 3) {
    return dom.textContent;
  }
  if (dom.nodeType === 1) {
    let name = dom.nodeName.toLowerCase();
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
        str += `${domToHyperscript(item.childNodes, depth + 1)}
${spaces}`;
      }
      str += `])`;
      return str;
    }
  }).join(",");
}
function findTexts(item, html) {
  let newChildren = [];
  if (item.children.length) {
    for (let i = 0; i < item.children.length; i++) {
      let child = item.children[i];
      let nextChild = item.children[i + 1];
      if (i === 0 && child.startsAt > item.contentStartsAt) {
        let childContent = html.substring(item.contentStartsAt, child.startsAt);
        let childText = {
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
        let childContent = html.substring(child.endsAt, nextChild.startsAt);
        let childText = {
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
        let childContent = html.substring(child.endsAt, item.contentEndsAt);
        let childText = {
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
    let childContent = html.substring(item.contentStartsAt, item.contentEndsAt);
    if (childContent.length) {
      let childText = {
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
    for (let key in item.attributes) {
      node.setAttribute(key, item.attributes[key]);
    }
    for (let i = 0; i < item.children.length; i++) {
      let child = convertToDom(item.children[i]);
      node.appendChild(child);
    }
  }
  return node;
}
function getObjectIndexTree(html) {
  let item;
  let regex = RegExp("<([^>|^!]+)>", "g");
  let items = [];
  while (item = regex.exec(html)) {
    if (item[0].startsWith("</")) {
      let lastOpenedItem = [...items].reverse().find((item2) => item2.endsAt === null);
      if (lastOpenedItem) {
        lastOpenedItem.endsAt = item.index + item[0].length;
        lastOpenedItem.contentEndsAt = item.index;
        let parent = [...items].reverse().find((item2) => item2.endsAt === null);
        if (parent) {
          let index = items.indexOf(lastOpenedItem);
          items.splice(index, 1);
          parent.children.push(lastOpenedItem);
        }
      }
      continue;
    }
    let element = {
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
    let attributesWithValues = string.match(/\S+="[^"]+"/g);
    if (attributesWithValues) {
      for (let attribute of attributesWithValues) {
        const [name, value] = attribute.trim().split("=");
        string = string.replace(attribute, "");
        if (value) {
          element.attributes[name] = value.replace(/(^"|"$)/g, "");
        }
      }
    }
    let attributesWithBooleanValues = string.match(/\s\S+=[^"]+/g);
    if (attributesWithBooleanValues) {
      for (let attribute of attributesWithBooleanValues) {
        const [name, value] = attribute.trim().split("=");
        string = string.replace(attribute, "");
        if (value) {
          element.attributes[name] = value;
        }
      }
    }
    let attributesWithEmptyValues = string.match(/\s?\S+/g);
    if (attributesWithEmptyValues) {
      for (let attribute of attributesWithEmptyValues) {
        const name = attribute.trim();
        element.attributes[name] = true;
      }
    }
    if (item[0].endsWith("/>")) {
      element.endsAt = element.startsAt + item[0].length;
      element.contentStartsAt = element.contentEndsAt = element.endsAt;
      let parent = [...items].reverse().find((item2) => item2.endsAt === null);
      if (parent) {
        parent.children.push(element);
        continue;
      }
    }
    items.push(element);
  }
  let fragmentItem = {
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
  let document2 = new Document();
  if (!openingTag) {
    let documentFragment = document2.createDocumentFragment();
    documentFragment.appendChild(document2.createTextNode(html));
    return documentFragment;
  }
  let fragment = getObjectIndexTree(html);
  if (fragment.childNodes.length > 1) {
    return fragment;
  }
  return fragment.childNodes[0];
}
function htmlToHyperscript(html) {
  let domTree = htmlToDom(html);
  let hyperscript = domToHyperscript(domTree instanceof DocumentFragment ? domTree.childNodes : [domTree]);
  return `[${hyperscript}
]`;
}
var document = new Document();

// lib/node/index.ts
import FormData from "form-data";

// lib/node/utils/icons.ts
import fs from "fs";
async function icons(source, configuration) {
  let options = {
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
  return new Promise((resolve, reject) => {
    favicons(source, options, (err, response) => {
      if (err) {
        process.stdout.write(err.status + "\n");
        process.stdout.write(err.name + "\n");
        process.stdout.write(err.message + "\n");
        return reject(err);
      }
      if (options.iconsPath) {
        for (let i in response.images) {
          fs.writeFileSync(options.iconsPath + response.images[i].name, response.images[i].contents);
        }
        for (let i in response.files) {
          fs.writeFileSync(options.iconsPath + response.files[i].name, response.files[i].contents);
        }
      }
      if (options.linksViewPath) {
        let html = `
  function Links(){
    return ${htmlToHyperscript(response.html.join(""))};
  }
  
  Links.default = Links;
  module.exports = Links;
        `;
        fs.writeFileSync(`${options.linksViewPath}/links.js`, html);
      }
      resolve(void 0);
    });
  });
}
icons.options = {
  iconsPath: null,
  linksViewPath: null,
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
  }
};

// lib/node/utils/inline.ts
import * as tsc from "tsc-prog";
import CleanCSS from "clean-css";
import { PurgeCSS } from "purgecss";
import esbuild from "esbuild";
import fs2 from "fs";
async function inline(file, options = {}) {
  if (typeof file === "string") {
    let ext = file.split(".").pop();
    if (ext && /(js|cjs|jsx|mjs|ts|tsx)/.test(ext)) {
      if (/(ts|tsx)/.test(ext) && !options.noValidate) {
        let declarationDir = options.declarationDir;
        let emitDeclaration = !!declarationDir;
        let tscProgOptions = {
          basePath: process.cwd(),
          configFilePath: "tsconfig.json",
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
      let esbuildOptions = {
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
      let result = await esbuild.build(esbuildOptions);
      if (options.compact) {
        const terser = await import("terser");
        let result2 = await terser.minify(result.outputFiles[1].text, {
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
        let mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
        let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result2.code, map: suffix, file };
      } else {
        let mapBase64 = Buffer.from(result.outputFiles[0].text.toString()).toString("base64");
        let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result.outputFiles[1].text, map: suffix, file };
      }
    } else if (ext && /(css|scss|styl)/.test(ext)) {
      let result = await new CleanCSS({
        sourceMap: true,
        level: {
          1: {
            roundingPrecision: "all=3"
          },
          2: {
            restructureRules: true
          }
        },
        ...options.cleanCss || {}
      }).minify([file]);
      return { raw: result.styles, map: null, file };
    } else {
      return { raw: fs2.readFileSync(file, "utf8"), map: null, file };
    }
  } else if (typeof file === "object" && "raw" in file) {
    return { map: null, ...file };
  }
}
inline.uncss = async function(renderedHtml, css, options = {}) {
  let html = await Promise.all(renderedHtml);
  let contents = html.map((item) => {
    return {
      raw: item,
      extension: "html"
    };
  });
  let purgecss = new PurgeCSS();
  let output = await purgecss.purge({
    fontFace: true,
    keyframes: true,
    variables: true,
    defaultExtractor: (content) => content.match(/[A-Za-z0-9-_/:@]*[A-Za-z0-9-_/:@/]+/g) || [],
    ...options,
    content: contents,
    css: [{ raw: css }]
  });
  let cleanCss = await new CleanCSS({
    sourceMap: false,
    level: {
      1: {
        roundingPrecision: "all=3"
      },
      2: {
        restructureRules: true
      }
    },
    ...options.cleanCss || {}
  }).minify(output[0].css);
  return cleanCss.styles;
};

// lib/node/utils/sw.ts
import fs3 from "fs";
import path from "path";
function sw(file, options = {}) {
  let swfiletemplate = path.resolve(__dirname, "./node.sw.tpl");
  let swTpl = fs3.readFileSync(swfiletemplate, "utf8");
  let opt = Object.assign(
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
  fs3.writeFileSync(file, contents, "utf8");
}

// lib/node/index.ts
var localValyrian;
async function plugin(v) {
  localValyrian = v;
  global.FormData = FormData;
  global.document = document;
}
function render(...args) {
  if (!localValyrian) {
    throw new Error("This plugin is not in use. Please invoke `v.use(nodePlugin)`");
  }
  let Component = () => args;
  let result = localValyrian.mount("div", Component);
  localValyrian.unmount();
  return result;
}
export {
  domToHtml,
  domToHyperscript,
  htmlToDom,
  htmlToHyperscript,
  icons,
  inline,
  plugin,
  render,
  sw
};
