/* eslint-disable no-use-before-define */
/* eslint-disable complexity */
interface ChildNodes extends Array<Node | Element | Text | DocumentFragment> {}

export class Node implements Node {
  // eslint-disable-next-line no-use-before-define
  childNodes: ChildNodes = [];
  baseURI: string = "";

  tag_name!: string;
  get nodeName(): string {
    return this.tag_name.toLowerCase();
  }
  set nodeName(name: string) {
    this.tag_name = name;
  }
  get tagName(): string {
    return this.tag_name;
  }
  set tagName(name: string) {
    this.tag_name = name;
  }

  node_type!: number;
  get nodeType(): number {
    return this.node_type;
  }
  set nodeType(type: number) {
    this.node_type = type;
  }

  node_value = "";
  attributes: Attr[] = [];
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
  parent_node: Node | null = null;
  get parentNode() {
    return this.parent_node;
  }
  set parentNode(node) {
    this.parent_node = node;
  }

  get parentElement(): Element | null {
    return this.parentNode instanceof Element ? this.parentNode : null;
  }

  set parentElement(node) {
    this.parentNode = node;
  }

  #dataset: Record<string | number, any> = {};

  get dataset() {
    return this.#dataset;
  }

  set dataset(value) {
    this.#dataset = value;
  }

  constructor() {}

  appendChild<T extends Node>(node: T): T {
    if (node) {
      node.parentNode && node.parentNode.removeChild(node as Node);
      this.childNodes.push(node);
      node.parentNode = this;
      node.parentElement = this instanceof Element ? this : null;
    }
    return node;
  }

  insertBefore<T extends Node>(node: T, child: Node | null): T {
    if (node) {
      node.parentNode && node.parentNode.removeChild(node as Node);
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

  replaceChild<T extends Node>(node: Node, child: T): T {
    if (node && child && child.parentNode === this) {
      this.insertBefore(node, child);
      child.parentNode && child.parentNode.removeChild(child);
    }
    return child;
  }
  removeChild<T extends Node>(child: T): T {
    if (child && child.parentNode === this) {
      const idx = (this.childNodes as unknown as Node[]).indexOf(child);
      (this.childNodes as unknown as Node[]).splice(idx, 1);
      child.parentNode = null;
      child.parentElement = null;
    }
    return child;
  }

  remove(): Node {
    return this.parentNode ? this.parentNode.removeChild(this) : this;
  }

  cloneNode(deep?: boolean | undefined): Node {
    if (this.nodeType === 3) {
      return new Text(this.nodeValue);
    }

    if (this.nodeType === 1) {
      const node = new Element();
      node.nodeType = this.nodeType;
      this.nodeName = this.nodeName;
      if (this.attributes) {
        for (let i = 0, l = this.attributes.length; i < l; i++) {
          node.setAttribute(this.attributes[i].nodeName, this.attributes[i].nodeValue);
        }
      }

      for (const key in this.dataset) {
        node.dataset[key] = this.dataset[key];
      }

      if (deep) {
        for (let i = 0, l = this.childNodes.length; i < l; i++) {
          node.appendChild(this.childNodes[i].cloneNode(deep));
        }
      }
      return node;
    }

    const node = new Node();
    node.nodeType = this.nodeType;
    node.nodeName = this.nodeName;
    return node;
  }

  setAttribute(name: string, value: any) {
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
    idx === -1 ? this.attributes.push(attr as Attr) : this.attributes.splice(idx, 1, attr as Attr);
  }

  getAttribute(name: string) {
    for (let i = 0, l = this.attributes.length; i < l; i++) {
      if (this.attributes[i].nodeName === name) {
        return this.attributes[i].nodeValue;
      }
    }
  }

  removeAttribute(name: string) {
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

  getElementById(id: string): Node | null {
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
  addEventListener(
    // eslint-disable-next-line no-unused-vars
    type: string,
    // eslint-disable-next-line no-unused-vars
    callback: EventListenerOrEventListenerObject | null,
    // eslint-disable-next-line no-unused-vars
    options?: boolean | AddEventListenerOptions | undefined
  ): void {
    // throw new Error("Method not implemented.");
  }
  // dispatchEvent(event: Event): boolean {
  //   throw new Error("Method not implemented.");
  // }
  removeEventListener(
    // eslint-disable-next-line no-unused-vars
    type: string,
    // eslint-disable-next-line no-unused-vars
    callback: EventListenerOrEventListenerObject | null,
    // eslint-disable-next-line no-unused-vars
    options?: boolean | EventListenerOptions | undefined
  ): void {
    // throw new Error("Method not implemented.");
  }
}

export class Text extends Node {
  constructor(text: any) {
    super();
    this.nodeType = 3;
    this.nodeName = "#text";
    this.node_value = String(text);
  }
}

function updateElementStyles(element: Element, state: Record<string, any>) {
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

export class Element extends Node {
  constructor() {
    super();
    this.nodeType = 1;
    this.attributes = [];
    this.childNodes = [];
  }

  _style = new Proxy(
    {},
    {
      get: (state: Record<string, any>, prop: string) => state[prop],
      set: (state: Record<string, any>, prop: string, value: any) => {
        state[prop] = value;
        updateElementStyles(this, state);
        return true;
      },
      deleteProperty: (state: Record<string, any>, prop: string) => {
        Reflect.deleteProperty(state, prop);
        updateElementStyles(this, state);
        return true;
      }
    }
  );

  get style() {
    return this._style as any;
  }

  set style(value: string) {
    if (typeof value === "string") {
      // should match pairs like "color: red; font-size: 12px; background: url(http://example.com/image.png?s=1024x1024&amp;w=is&amp;k=20&amp;c=ASa_AG8uP5Di7azXgJraSA6ME7fbLB0GX4YT_OzCARI=);"
      const regex = /([^:\s]+):\s*((url\([^)]+\))|[^;]+(?=(;|$)))/g;
      let match;

      while ((match = regex.exec(value)) !== null) {
        this._style[match[1]] = match[2].trim();
      }

      return;
    }

    throw new Error("Cannot set style");
  }

  get className(): string {
    return this.getAttribute("class") || "";
  }

  set className(value: string | boolean) {
    if (value == null || value === false) {
      this.removeAttribute("class");
    } else {
      this.setAttribute("class", String(value));
    }
  }

  classList = {
    toggle: (item: any, force: any) => {
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

  get id(): string {
    return this.getAttribute("id") || "";
  }

  set id(value: string | boolean) {
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
      // console.log("domToHtml", this.childNodes[i], domToHtml(this.childNodes[i] as Element));
      str += domToHtml(this.childNodes[i] as Element);
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

  get outerHTML(): string {
    return domToHtml(this);
  }
}

export class DocumentFragment extends Element {
  constructor() {
    super();
    this.nodeType = 11;
    this.nodeName = "#document-fragment";
  }
}

export class Document extends Element {
  constructor() {
    super();
    this.nodeType = 9;
    this.nodeName = "#document";
    this.body = this.createElement("body");
  }

  body: Element;

  createDocumentFragment(): DocumentFragment {
    return new DocumentFragment();
  }

  createElement(type: string) {
    const element = new Element();
    element.nodeName = type.toUpperCase();
    return element;
  }

  createElementNS(ns: string, type: string) {
    const element = this.createElement(type);
    element.baseURI = ns;
    return element;
  }

  createTextNode(text: any) {
    return new Text(text);
  }
}

const selfClosingTags = [
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

export function domToHtml(dom: Element | Text | DocumentFragment): string {
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
          const child = domToHtml(dom.childNodes[i] as Element);
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

export function domToHyperscript(childNodes: ChildNodes, depth = 1) {
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
          const attrs: Record<string, any> = {};
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
          str += `${domToHyperscript(item.childNodes as unknown as Element[], depth + 1)}\n${spaces}`;
        }

        str += `])`;
        return str;
      }
    })
    .join(",");
}

interface ObjectIndexItem {
  tagName: string;
  startsAt: number;
  endsAt: number | null;
  contentStartsAt: number;
  contentEndsAt: number | null;
  attributes: { [key: string]: any };
  children: ObjectIndexItem[];
  nodeValue: string | null;
}

interface ObjectIndexItemWithContent extends ObjectIndexItem {
  endsAt: number;
  contentEndsAt: number;
  children: ObjectIndexItemWithContent[];
}

interface ObjectIndexList extends Array<ObjectIndexItem> {}

function findTexts(item: ObjectIndexItemWithContent, html: string) {
  const newChildren: ObjectIndexItemWithContent[] = [];

  // If the item has children
  if (item.children.length) {
    // Search for texts in the children.
    for (let i = 0; i < item.children.length; i++) {
      const child = item.children[i];
      const nextChild = item.children[i + 1];

      // If is the first child and the child startsAt is greater than the item contentStartsAt then
      // the content between the item contentStartsAt and the child startsAt is a text child of the item.
      if (i === 0 && child.startsAt > item.contentStartsAt) {
        const childContent = html.substring(item.contentStartsAt, child.startsAt);

        const childText: ObjectIndexItemWithContent = {
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

      // Add the child to the newChildren array.
      newChildren.push(child);

      // If there is a next child and the child endsAt is less than the next child startsAt then
      // the content between the child endsAt and the next child startsAt is a text child of the item.
      if (nextChild && child.endsAt < nextChild.startsAt) {
        const childContent = html.substring(child.endsAt, nextChild.startsAt);

        const childText: ObjectIndexItemWithContent = {
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

      // If there are no next child and the child endsAt is less than the item contentEndsAt then
      // the content between the child endsAt and the item contentEndsAt is a text child of the item.
      if (!nextChild && child.endsAt < item.contentEndsAt) {
        const childContent = html.substring(child.endsAt, item.contentEndsAt);

        const childText: ObjectIndexItemWithContent = {
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

      // Find texts in the child.
      findTexts(child, html);
    }
  }

  // If the item has no children then set the contents between the item contentStartsAt and the item contentEndsAt
  // as a text child of the item.
  if (!item.children.length) {
    const childContent = html.substring(item.contentStartsAt, item.contentEndsAt);

    if (childContent.length) {
      const childText: ObjectIndexItemWithContent = {
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

function convertToDom<T extends Node>(item: ObjectIndexItemWithContent): T {
  let node: T;

  if (item.tagName === "#text") {
    node = document.createTextNode(item.nodeValue as string) as unknown as T;
  } else {
    node = (item.tagName === "#document-fragment"
      ? document.createDocumentFragment()
      : document.createElement(item.tagName)) as unknown as T;

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

// eslint-disable-next-line sonarjs/cognitive-complexity
function getObjectIndexTree(html: string): DocumentFragment {
  let item;
  const regex = RegExp("<([^>|^!]+)>", "g");
  const items: ObjectIndexList = [];

  // Make the initial list of items.
  while ((item = regex.exec(html))) {
    // If is a closing tag
    if (item[0].startsWith("</")) {
      const lastOpenedItem = [...items].reverse().find((item) => item.endsAt === null);
      if (lastOpenedItem) {
        lastOpenedItem.endsAt = item.index + item[0].length;
        lastOpenedItem.contentEndsAt = item.index;

        // Find the last opened item again, this will be the parent of the current item.
        const parent = [...items].reverse().find((item) => item.endsAt === null);
        if (parent) {
          // Find the index of the current item in the items array.
          const index = items.indexOf(lastOpenedItem);
          // Remove the last opened item from the items array.
          items.splice(index, 1);

          // Add the last opened item as a child of the parent.
          parent.children.push(lastOpenedItem);
        }
      }

      continue;
    }

    // If is an opening tag
    const element: ObjectIndexItem = {
      tagName: item[1].split(" ")[0],
      startsAt: item.index,
      endsAt: null,
      contentStartsAt: item.index + item[0].length,
      contentEndsAt: null,
      attributes: {},
      children: [],
      nodeValue: null
    };

    // Find the attributes of the tag.
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

    // If the tag is self closing
    if (item[0].endsWith("/>")) {
      element.endsAt = element.startsAt + item[0].length;
      element.contentStartsAt = element.contentEndsAt = element.endsAt;

      // Find the last opened item, this will be the parent of the current item.
      const parent = [...items].reverse().find((item) => item.endsAt === null);
      if (parent) {
        // Add the last opened item as a child of the parent.
        parent.children.push(element);
        continue;
      }
    }

    items.push(element);
  }

  const fragmentItem: ObjectIndexItemWithContent = {
    tagName: "#document-fragment",
    startsAt: 0,
    endsAt: html.length,
    contentStartsAt: 0,
    contentEndsAt: html.length,
    attributes: {},
    children: items as ObjectIndexItemWithContent[],
    nodeValue: null
  };

  findTexts(fragmentItem, html);

  return convertToDom<DocumentFragment>(fragmentItem);
}

// First we create a tree of object indexes from the HTML string.
// The resulting array is then reordered to match the order of the html string.
// And to move the children to the correct position in its parents.
// This resulting array is populated with a object node version of the object index.
// If the final result have more than 1 node, then return a document fragment node.
// If the final result have 1 node, then return the node.
// eslint-disable-next-line complexity
export function htmlToDom(html: string): Element | Text | DocumentFragment {
  // Search for the opening and closing tags of the root element.
  // The opening tag could be in the middle of the string, so we need to
  // search for the first opening tag.
  const openingTag = html.match(/<[^>]+>/g);

  const document = new Document();

  // If the opening tag is not found, return a document fragment node with the html string as text content.
  if (!openingTag) {
    const documentFragment = document.createDocumentFragment();
    documentFragment.appendChild(document.createTextNode(html));
    return documentFragment;
  }

  const fragment = getObjectIndexTree(html);

  if (fragment.childNodes.length > 1) {
    return fragment;
  }

  return fragment.childNodes[0];
}

export function htmlToHyperscript(html: string) {
  const domTree = htmlToDom(html);
  const hyperscript = domToHyperscript(domTree instanceof DocumentFragment ? domTree.childNodes : [domTree]);
  return `[${hyperscript}\n]`;
}

export const document = new Document();

const html = document.createElement("html");
html.appendChild(document.createElement("head"));
html.appendChild(document.body);
