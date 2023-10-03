/* eslint-disable no-use-before-define */
/* eslint-disable indent */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */

interface DefaultRecord extends Record<string | number | symbol, any> {}

// The VnodeProperties interface represents properties that can be passed to a virtual node.
export interface VnodeProperties extends DefaultRecord {
  // A unique key for the virtual node, which can be a string or a number.
  // This is useful for optimizing updates in a list of nodes.
  key?: string | number;
  // A state object that is associated with the virtual node.
  state?: any;
}

// The DomElement interface extends the Element interface with an index signature.
// This allows for any additional properties to be added to DOM elements.
export interface DomElement extends Element, DefaultRecord {}

// The VnodeInterface represents a virtual node. It has a number of optional fields,
// including a tag, props, children, and a DOM element.
export interface VnodeInterface extends DefaultRecord {
  // The constructor for the virtual node. It takes a tag, props, and children as arguments.
  // The tag can be a string, a component, or a POJO component.
  // eslint-disable-next-line no-unused-vars
  new (tag: string | Component | POJOComponent, props: VnodeProperties, children: Children): VnodeInterface;
  // The tag for the virtual node. It can be a string, a component, or a POJO component.
  tag: string | Component | POJOComponent;
  // The props for the virtual node.
  props: VnodeProperties;
  // The children for the virtual node.
  children: Children;
  // A boolean indicating whether the virtual node is an SVG element.
  isSVG?: boolean;
  // The DOM element that corresponds to the virtual node.
  dom?: DomElement;
  // A boolean indicating whether the virtual node has been processed in the keyed diffing algorithm.
  processed?: boolean;
}

// The VnodeWithDom interface represents a virtual node that has a DOM element associated with it.
export interface VnodeWithDom extends VnodeInterface {
  dom: DomElement;
}

// The Component interface represents a function that returns a virtual node or a list of virtual nodes.
// It can also have additional properties.
export interface Component extends DefaultRecord {
  // The function that returns a virtual node or a list of virtual nodes.
  // It can take props and children as arguments.
  // eslint-disable-next-line no-unused-vars
  (props?: VnodeProperties | null, ...children: any[]): VnodeInterface | Children | any;
}

// The POJOComponent interface represents a "plain old JavaScript object" (POJO) component.
// It has a view function that returns a virtual node or a list of virtual nodes,
// as well as optional props and children.
// It can be used also to identify class instance components.
export interface POJOComponent extends DefaultRecord {
  // The view function that returns a virtual node or a list of virtual nodes.
  view: Component;
  // The props for the component.
  props?: VnodeProperties | null;
  // The children for the component.
  children?: any[];
}

// The VnodeComponentInterface represents a virtual node that has a component as its tag.
// It has props and children, just like a regular virtual node.
export interface VnodeComponentInterface extends VnodeInterface {
  tag: Component | POJOComponent;
  props: VnodeProperties;
  children: Children;
}

// The Children interface represents a list of virtual nodes or other values.
export interface Children extends Array<VnodeInterface | VnodeComponentInterface | any> {}

// The Directive interface represents a function that can be applied to a virtual node.
// It receives the value, virtual node, and old virtual node as arguments, and can return a boolean value.
// If only the virtual node is passed, it means its the on create phase for the v-node.
// If the old virtual node is also passed, it means its the on update phase for the v-node.
export interface Directive {
  // eslint-disable-next-line no-unused-vars
  (value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | boolean;
}

// The Directives interface is a mapping of directive names to Directive functions.
export interface Directives extends Record<string, Directive> {}

// The ReservedProps interface is a mapping of reserved prop names to the value `true`.
// These prop names cannot be used as custom prop names.
export interface ReservedProps extends Record<string, true> {}

// The Current interface represents the current component and virtual node that are being processed.
export interface Current {
  // The current component. It can be a component, a POJO component, or null.
  component: Component | POJOComponent | null;
  // The current virtual node. It must have a DOM element associated with it.
  vnode: VnodeWithDom | null;
  // The old virtual node. It must have a DOM element associated with it.
  oldVnode?: VnodeWithDom | null;
  // The current event. It can be an event or null.
  event: Event | null;
}

// The V function is the main function for creating virtual nodes.
// It takes a tag or component, props, and children as arguments, and returns a virtual node.
export interface V {
  // eslint-disable-next-line no-unused-vars, no-use-before-define
  (tagOrComponent: string | Component | POJOComponent, props: VnodeProperties | null, ...children: Children):
    | VnodeInterface
    | VnodeComponentInterface;
  // eslint-disable-next-line no-unused-vars, no-use-before-define
  fragment(_: any, ...children: Children): Children;
}

// 'textTag' is a constant string that is used to represent text nodes in the virtual DOM.
const textTag = "#text";

// 'isNodeJs' is a boolean that is true if the code is running in a Node.js environment and false otherwise.
// It is determined by checking if the 'process' global object is defined and has a 'versions' property.
export const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

// 'createDomElement' is a function that creates a new DOM element with the specified tag name.
// If 'isSVG' is true, it creates an SVG element instead of a regular DOM element.
export function createDomElement(tag: string, isSVG: boolean = false): DomElement {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}

// 'Vnode' is a class that represents a virtual DOM node.
// It has three properties: 'tag', 'props', and 'children'.
// 'Vnode' is exported as an object with a type of 'VnodeInterface'.
// The 'as unknown as VnodeInterface' is used to tell TypeScript that the 'Vnode' function has the same type as 'VnodeInterface'.
export const Vnode = function Vnode(this: VnodeInterface, tag: string, props: VnodeProperties, children: Children) {
  // 'this' refers to the current instance of 'Vnode'.
  this.tag = tag;
  this.props = props;
  this.children = children;
} as unknown as VnodeInterface;

// 'isComponent' is a function that returns true if the given 'component' is a valid component and false otherwise.
// A component is either a function or an object with a 'view' function.
export function isComponent(component: unknown): component is Component {
  return Boolean(
    component && (typeof component === "function" || (typeof component === "object" && "view" in component))
  );
}

// 'isVnode' is a function that returns true if the given 'object' is a 'Vnode' instance and false otherwise.
export const isVnode = (object?: unknown | VnodeInterface): object is VnodeInterface => {
  // Use the 'instanceof' operator to check if 'object' is an instance of 'Vnode'.
  return object instanceof Vnode;
};

// 'isVnodeComponent' is a function that returns true if the given 'object' is a 'Vnode' instance with a 'tag' property that is a valid component.
// It returns false otherwise.
export const isVnodeComponent = (object?: unknown | VnodeComponentInterface): object is VnodeComponentInterface => {
  // Check if 'object' is a 'Vnode' instance and its 'tag' property is a valid component.
  return isVnode(object) && isComponent(object.tag);
};

// 'domToVnode' is a function that converts a DOM node to a 'Vnode' instance.
export function domToVnode(dom: any): VnodeWithDom {
  // If the child node is a text node, create a 'Vnode' instance with the 'textTag' constant as the 'tag' property.
  // Set the 'dom' property of the 'Vnode' instance to the child DOM node.
  // Push the 'Vnode' instance to the 'children' array.
  if (dom.nodeType === 3) {
    return dom.nodeValue;
  }

  const children: VnodeWithDom[] = [];
  // Iterate through all child nodes of 'dom'.
  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    const childDom = dom.childNodes[i];
    // If the child node is an element node, recursively call 'domToVnode' to convert it to a 'Vnode' instance.
    // Push the 'Vnode' instance to the 'children' array.
    if (childDom.nodeType === 3) {
      children.push(childDom.nodeValue);
    } else if (childDom.nodeType === 1) {
      children.push(domToVnode(childDom));
    }
  }

  const props: VnodeProperties = {};
  // Iterate through all attributes of 'dom'.
  for (let i = 0, l = dom.attributes.length; i < l; i++) {
    const attr = dom.attributes[i];
    // Add the attribute to the 'props' object, using the attribute's name as the key and its value as the value.
    props[attr.nodeName] = attr.nodeValue;
  }

  // Create a new 'Vnode' instance with the 'tag' property set to the lowercase version of the DOM node's tag name.
  // Set the 'props' and 'children' properties to the 'props' and 'children' arrays respectively.
  // Set the 'dom' property of the 'Vnode' instance to the DOM node.
  const vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
  vnode.dom = dom;
  return vnode as VnodeWithDom;
}

// This function takes in an HTML string and creates a virtual node representation of it
// using the `domToVnode` function. It does this by creating a new `div` element, setting
// its `innerHTML` to the provided HTML string, and then using `map` to iterate over the
// `childNodes` of the `div` element, passing each one to `domToVnode` to create a virtual
// node representation of it. The resulting array of virtual nodes is then returned.
export function trust(htmlString: string) {
  const div = createDomElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item));
}

/* ========================================================================== */
/* Main Component implementation                                              */
/* ========================================================================== */

// These variables are used to store the main component, the main virtual node, and whether
// the main component is currently mounted.
let mainComponent: VnodeComponentInterface | null = null;
let mainVnode: VnodeWithDom | null = null;
let isMounted = false;

// This object is used to store the current virtual node and component being rendered.
export const current: Current = {
  vnode: null,
  oldVnode: null,
  component: null,
  event: null
};

/* Reserved props ----------------------------------------------------------- */
// This object is used to store the names of reserved props, which are props that are reserved
// for special purposes and should not be used as regular component props.
export const reservedProps: Record<string, true> = {
  key: true,
  state: true,
  "v-keep": true,

  // Built in directives
  "v-if": true,
  "v-unless": true,
  "v-for": true,
  "v-show": true,
  "v-class": true,
  "v-html": true,
  "v-model": true,
  "v-create": true,
  "v-update": true,
  "v-cleanup": true
};

/* Mounting, Updating, Cleanup and Unmounting ------------------------------- */
// These sets are used to store callbacks for various lifecycle events: mounting, updating,
// cleaning up, and unmounting.
const onCleanupSet: Set<Function> = new Set();
const onMountSet: Set<Function> = new Set();
const onUpdateSet: Set<Function> = new Set();
const onUnmountSet: Set<Function> = new Set();

// These functions allow users to register callbacks for the corresponding lifecycle events.
export function onMount(callback: Function) {
  if (!isMounted) {
    onMountSet.add(callback);
  }
}

export function onUpdate(callback: Function) {
  onUpdateSet.add(callback);
}

export function onCleanup(callback: Function) {
  onCleanupSet.add(callback);
}

export function onUnmount(callback: Function) {
  if (!isMounted) {
    onUnmountSet.add(callback);
  }
}

// This function is used to call all the callbacks in a given set.
function callSet(set: Set<Function>) {
  for (const callback of set) {
    callback();
  }

  set.clear();
}

/* Event listener ----------------------------------------------------------- */

// This object stores the names of event listeners that have been added
const eventListenerNames: Record<string, true> = {};

// This function is called when an event occurs
function eventListener(e: Event) {
  // Set the current event to the event that occurred so that it can be prevented if necessary
  current.event = e;

  // Convert the target of the event to a DOM element
  let dom = e.target as DomElement;

  // Create the name of the event listener by adding "v-on" to the event type
  const name = `v-on${e.type}`;

  // Keep going up the DOM tree until we find an element with an event listener
  // matching the event type
  while (dom) {
    if (dom[name]) {
      // Call the event listener function
      dom[name](e, dom);

      // If the default action of the event hasn't been prevented, update the DOM
      if (!e.defaultPrevented) {
        update();
      }
      return;
    }
    dom = dom.parentNode as DomElement;
  }

  current.event = null;
}

/* Directives --------------------------------------------------------------- */

// This function creates a directive that hides an element based on a condition
const hideDirective = (test: boolean) => (bool: boolean, vnode: VnodeWithDom, oldnode?: VnodeInterface) => {
  // If test is true, use the value of bool. Otherwise, use the opposite of bool.
  const value = test ? bool : !bool;

  // If the value is true, hide the element by replacing it with a text node
  if (value) {
    const parentNode = vnode.dom?.parentNode;
    if (parentNode) {
      const newdom = document.createTextNode("");
      parentNode.replaceChild(newdom, vnode.dom);
    }

    return false;
  }
};

// This object stores all the available directives
export const directives: Directives = {
  // The "v-if" directive hides an element if the given condition is false
  "v-if": hideDirective(false),

  // The "v-unless" directive hides an element if the given condition is true
  "v-unless": hideDirective(true),

  // The "v-for" directive creates a loop and applies a callback function to each item in the loop
  "v-for": (set: unknown[], vnode: VnodeWithDom) => {
    const newChildren: VnodeInterface[] = [];
    const callback = vnode.children[0];
    for (let i = 0, l = set.length; i < l; i++) {
      newChildren.push(callback(set[i], i));
    }
    vnode.children = newChildren;
  },

  // The "v-show" directive shows or hides an element by setting the "display" style property
  "v-show": (bool: boolean, vnode: VnodeWithDom) => {
    (
      vnode.dom as unknown as {
        style: { display: string };
      }
    ).style.display = bool ? "" : "none";
  },

  // The "v-class" directive adds or removes class names from an element based on a condition
  "v-class": (classes: { [x: string]: boolean }, vnode: VnodeWithDom) => {
    // Loop through all the class names in the classes object
    for (const name in classes) {
      // Add or remove the class name from the element's class list based on the value in the classes object
      (vnode.dom as DomElement).classList.toggle(name, classes[name]);
    }
  },

  // The "v-html" directive sets the inner HTML of an element to the given HTML string
  "v-html": (html: string, vnode: VnodeWithDom) => {
    // Set the children of the vnode to a trusted version of the HTML string
    vnode.children = [trust(html)];
  },

  // The "v-model" directive binds the value of an input element to a model property
  "v-model": ([model, property, event]: any[], vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => {
    let value;
    // This function updates the model property when the input element's value changes
    let handler = (e: Event) => (model[property] = (e.target as DomElement & Record<string, any>).value);
    if (vnode.tag === "input") {
      // If the element is an input, use the "input" event by default
      event = event || "oninput";
      // Depending on the type of input element, use a different handler function
      switch (vnode.props.type) {
        case "checkbox": {
          if (Array.isArray(model[property])) {
            // If the model property is an array, add or remove the value from the array when the checkbox is checked or unchecked
            handler = (e: Event) => {
              const val = (e.target as DomElement & Record<string, any>).value;
              const idx = model[property].indexOf(val);
              if (idx === -1) {
                model[property].push(val);
              } else {
                model[property].splice(idx, 1);
              }
            };
            // If the value is in the array, set the checkbox to be checked
            value = model[property].indexOf(vnode.dom.value) !== -1;
          } else if ("value" in vnode.props) {
            // If the input element has a "value" attribute, use it to determine the checked state
            handler = () => {
              if (model[property] === vnode.props.value) {
                model[property] = null;
              } else {
                model[property] = vnode.props.value;
              }
            };
            value = model[property] === vnode.props.value;
          } else {
            // If there is no "value" attribute, use a boolean value for the model property
            handler = () => (model[property] = !model[property]);
            value = model[property];
          }
          // Set the "checked" attribute on the input element
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("checked", value, vnode);
          break;
        }
        case "radio": {
          // If the element is a radio button, set the "checked" attribute based on the value of the model property
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("checked", model[property] === vnode.dom.value, vnode);
          break;
        }
        default: {
          // For all other input types, set the "value" attribute based on the value of the model property
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("value", model[property], vnode);
        }
      }
    } else if (vnode.tag === "select") {
      // If the element is a select element, use the "click" event by default
      event = event || "onclick";
      if (vnode.props.multiple) {
        // If the select element allows multiple selections, update the model property with an array of selected values
        handler = (e: Event & Record<string, any>) => {
          const val = (e.target as DomElement & Record<string, any>).value;
          if (e.ctrlKey) {
            // If the Ctrl key is pressed, add or remove the value from the array
            const idx = model[property].indexOf(val);
            if (idx === -1) {
              model[property].push(val);
            } else {
              model[property].splice(idx, 1);
            }
          } else {
            // If the Ctrl key is not pressed, set the model property to an array with the selected value
            model[property].splice(0, model[property].length);
            model[property].push(val);
          }
        };
        // Set the "selected" attribute on the options based on whether they are in the model property array
        vnode.children.forEach((child: VnodeInterface) => {
          if (child.tag === "option") {
            const value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value) !== -1;
          }
        });
      } else {
        // If the select element does not allow multiple selections, set the "selected" attribute on the options based on the value of the model property
        vnode.children.forEach((child: VnodeInterface) => {
          if (child.tag === "option") {
            const value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = value === model[property];
          }
        });
      }
    } else if (vnode.tag === "textarea") {
      // If the element is a textarea, use the "input" event by default
      event = event || "oninput";
      // Set the textarea's content to the value of the model property
      vnode.children = [model[property]];
    }

    // We assume that the prev handler if any will not be changed by the user across patchs
    const prevHandler = vnode.props[event];

    // Set the event handler on the element
    // eslint-disable-next-line no-use-before-define
    sharedSetAttribute(
      event,
      (e: Event) => {
        handler(e);

        // If the previous handler is defined, call it after the model has been updated
        if (prevHandler) {
          prevHandler(e);
        }
      },
      vnode,
      oldVnode
    );
  },

  // The "v-create" directive is called when a new virtual node is created.
  // The provided callback function is called with the new virtual node as an argument.
  // This directive is only called once per virtual node, when it is first created.
  // eslint-disable-next-line no-unused-vars
  "v-create": (callback: (vnode: VnodeWithDom) => void, vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => {
    // If this is not an update, call the callback function with the new virtual node
    if (!oldVnode) {
      const cleanup = callback(vnode);

      // If the callback function returns a function, call it when the update is gonna be cleaned up
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },

  // The "v-update" directive is called when an existing virtual node is updated.
  // The provided callback function is called with the new and old virtual nodes as arguments.
  // This directive is only called once per virtual node update.
  "v-update": (
    // eslint-disable-next-line no-unused-vars
    callback: (vnode: VnodeWithDom, oldVnode: VnodeWithDom) => void,
    vnode: VnodeWithDom,
    oldVnode?: VnodeWithDom
  ) => {
    // If this is an update, call the callback function with the new and old virtual nodes
    if (oldVnode) {
      const cleanup = callback(vnode, oldVnode);

      // If the callback function returns a function, call it when the update is gonna be cleaned up
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },

  // The "v-cleanup" directive is called when the update is cleaned up.
  // The provided callback function is called with the old virtual node as an argument.
  // This directive is only called once per virtual node, when the update is cleaned up.
  "v-cleanup": (
    // eslint-disable-next-line no-unused-vars
    callback: (vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => void,
    vnode: VnodeWithDom,
    oldVnode?: VnodeWithDom
  ) => {
    // Add the callback function to the list of cleanup functions to be called when the update is cleaned up
    onCleanup(() => callback(vnode, oldVnode));
  }
};
// Add a directive to the global directives object, with the key being the name
// preceded by "v-". Also add the name to the global reservedProps object.
export function directive(name: string, directive: Directive) {
  const directiveName = `v-${name}`;
  directives[directiveName] = directive;
  reservedProps[directiveName] = true;
}

// Set an attribute on a virtual DOM node and update the actual DOM element.
// If the attribute value is a function, add an event listener for the attribute
// name to the DOM element represented by mainVnode.
// If oldVnode is provided, compare the new attribute value to the old value
// and only update the attribute if the values are different.
function sharedSetAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | boolean {
  // If the attribute value is a function, add an event listener for the attribute
  // name to the DOM element represented by mainVnode.
  if (typeof value === "function") {
    // Only add the event listener if it hasn't been added yet.
    if (name in eventListenerNames === false) {
      (mainVnode as VnodeWithDom).dom.addEventListener(name.slice(2), eventListener);
      eventListenerNames[name] = true;
    }
    newVnode.dom[`v-${name}`] = value;
    return;
  }

  // If the attribute is present on the DOM element and newVnode is not an SVG,
  // update the attribute if the value has changed.
  if (newVnode.isSVG === false && name in newVnode.dom) {
    // eslint-disable-next-line eqeqeq
    if (newVnode.dom[name] != value) {
      newVnode.dom[name] = value;
    }
    return;
  }

  // If oldVnode is not provided or the attribute value has changed, update the
  // attribute on the DOM element.
  if (!oldVnode || value !== oldVnode.props[name]) {
    if (value === false) {
      newVnode.dom.removeAttribute(name);
    } else {
      newVnode.dom.setAttribute(name, value);
    }
  }
}

// Set an attribute on a virtual DOM node and update the actual DOM element.
// Skip the attribute if it is in the reservedProps object.
export function setAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
  if (reservedProps[name]) {
    return;
  }
  newVnode.props[name] = value;
  sharedSetAttribute(name, value, newVnode, oldVnode);
}

// Update the attributes on a virtual DOM node. If oldVnode is provided, remove
// attributes from the DOM element that are not present in newVnode.props but are
// present in oldVnode.props. Then, iterate over the attributes in newVnode.props
// and update the DOM element with the attributes using the sharedSetAttribute
// function. If an attribute is in the reservedProps object and has a corresponding
// directive in the directives object, call the directive with the attribute value
// and the two virtual DOM nodes as arguments. If the directive returns false, exit
// the loop.
export function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
  // If oldVnode is provided, remove attributes from the DOM element that are not
  // present in newVnode.props but are present in oldVnode.props.
  if (oldVnode) {
    for (const name in oldVnode.props) {
      if (!newVnode.props[name] && !eventListenerNames[name] && !reservedProps[name]) {
        if (newVnode.isSVG === false && name in newVnode.dom) {
          newVnode.dom[name] = null;
        } else {
          newVnode.dom.removeAttribute(name);
        }
      }
    }
  }

  // Iterate over the attributes in newVnode.props and update the DOM element with
  // the attributes using the sharedSetAttribute function.
  for (const name in newVnode.props) {
    if (reservedProps[name]) {
      // If there is a directive for the attribute, call it with the attribute value
      // and the two virtual DOM nodes as arguments. If the directive returns false,
      // exit the loop.
      if (directives[name] && directives[name](newVnode.props[name], newVnode, oldVnode) === false) {
        break;
      }
      continue;
    }
    sharedSetAttribute(name, newVnode.props[name], newVnode, oldVnode);
  }
}

/* patch ------------------------------------------------------------------- */

// Patch a DOM node with a new VNode tree
export function patch(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
  // If the new tree has no children, set the text content of the parent DOM element to an empty string
  if (newVnode.children.length === 0) {
    newVnode.dom.textContent = "";
    return;
  }

  // Get the children of the new and old virtual DOM nodes
  const newTree = newVnode.children;
  const oldTree = oldVnode?.children || [];
  // Get the length of the old tree
  const oldTreeLength = oldTree.length;
  // Get the length of the new tree
  let newTreeLength = newTree.length;
  // Set the global current object to the new and old virtual DOM nodes
  current.vnode = newVnode;
  current.oldVnode = oldVnode;

  // Flatten the new tree
  // Take into account that is necessary to flatten the tree before the patch process
  // to let the hooks and signals work properly
  let i = 0;
  while (i < newTreeLength) {
    const newChild = newTree[i];

    // If the new child is a Vnode and is not a text node
    if (newChild instanceof Vnode) {
      // If the tag of the new child is not a string, it is a component
      if (typeof newChild.tag !== "string") {
        // Set the current component to the tag of the new child
        current.component = newChild.tag;
        // Replace the new child with the result of calling its view or bind method, passing in the props and children as arguments
        newTree.splice(
          i,
          1,
          ("view" in newChild.tag ? newChild.tag.view.bind(newChild.tag) : newChild.tag.bind(newChild.tag))(
            newChild.props,
            ...newChild.children
          )
        );
        newTreeLength = newTree.length;
        continue;
      } else {
        i++;
      }
      // If the new child is an array, flatten it and continue the loop
    } else if (Array.isArray(newChild)) {
      newTree.splice(i, 1, ...newChild);
      newTreeLength = newTree.length;
      // If the new child is null or undefined, remove it from the new tree and continue the loop
    } else if (newChild == null) {
      newTree.splice(i, 1);
      newTreeLength = newTree.length;
    } else {
      // If the new child is not a Vnode or an array, it is a text node
      // just continue the loop
      i++;
    }
  }

  // If the new tree has no children, set the text content of the parent DOM element to an empty string
  if (newTreeLength === 0) {
    newVnode.dom.textContent = "";
    return;
  }

  // If the old tree has children and the first child of the new tree is a VNode with a "key"
  // attribute and the first child of the old tree is a VNode with a "key" attribute, update
  // the DOM element in place by comparing the keys of the nodes in the trees.
  if (
    oldTreeLength > 0 &&
    newTree[0] instanceof Vnode &&
    oldTree[0] instanceof Vnode &&
    "key" in newTree[0].props &&
    "key" in oldTree[0].props
  ) {
    const oldKeyedList: Record<string, number> = {};
    const newKeyedList: Record<string, number> = {};
    const childNodes = newVnode.dom.childNodes;

    // Create key maps while also handling removal of nodes not present in newTree
    for (let i = 0; i < oldTreeLength; i++) {
      oldKeyedList[oldTree[i].props.key] = i;
      if (i < newTreeLength) {
        newKeyedList[newTree[i].props.key] = i;
      }
    }

    for (let i = 0; i < newTreeLength; i++) {
      const newChild = newTree[i];
      const oldChildIndex = oldKeyedList[newChild.props.key];
      const oldChild = oldTree[oldChildIndex];
      let shouldPatch = true;

      if (oldChild) {
        newChild.dom = oldChild.dom;
        if ("v-keep" in newChild.props && newChild.props["v-keep"] === oldChild.props["v-keep"]) {
          newChild.children = oldChild.children;
          shouldPatch = false;
        } else {
          updateAttributes(newChild, oldChild);
        }
      } else {
        newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
        updateAttributes(newChild);
      }

      const currentNode = childNodes[i];
      if (!currentNode) {
        newVnode.dom.appendChild(newChild.dom);
      } else if (currentNode !== newChild.dom) {
        newVnode.dom.replaceChild(newChild.dom, currentNode);
      }

      shouldPatch && patch(newChild, oldChild);
    }

    // Remove nodes that don't exist in newTree
    for (let i = newTreeLength; i < oldTreeLength; i++) {
      if (!newKeyedList[oldTree[i].props.key]) {
        const domToRemove = oldTree[i].dom;
        domToRemove.parentNode && domToRemove.parentNode.removeChild(domToRemove);
      }
    }
    return;
  }

  // Patch the the old tree
  for (let i = 0; i < newTreeLength; i++) {
    const newChild = newTree[i];
    const oldChild = oldTree[i];
    const isGreaterThanOldTreeLength = i >= oldTreeLength;

    if (newChild instanceof Vnode === false) {
      if (isGreaterThanOldTreeLength || oldChild instanceof Vnode) {
        // If there's no corresponding old child, create a new text node for the new child
        const dom = document.createTextNode(newChild as string);

        if (isGreaterThanOldTreeLength) {
          // Append the new child to the dom
          newVnode.dom.appendChild(dom);
        } else {
          newVnode.dom.replaceChild(dom, newVnode.dom.childNodes[i]);
        }
        continue;
      }

      // If the old child is not a vnode
      // eslint-disable-next-line eqeqeq
      if (newVnode.dom.childNodes[i].textContent != newChild) {
        newVnode.dom.childNodes[i].textContent = newChild as string;
      }
      continue;
    }

    // Set the isSVG flag for the new child if it is an SVG element or if the parent is an SVG element
    newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";

    if (isGreaterThanOldTreeLength || oldChild instanceof Vnode === false || newChild.tag !== oldChild.tag) {
      // If there's no corresponding old child, create a new dom element for the new child
      newChild.dom = createDomElement(newChild.tag as string, newChild.isSVG);

      if (isGreaterThanOldTreeLength) {
        // Append the new child to the dom
        newVnode.dom.appendChild(newChild.dom);
      } else {
        newVnode.dom.replaceChild(newChild.dom, newVnode.dom.childNodes[i]);
      }

      // Update the attributes of the new child
      updateAttributes(newChild as VnodeWithDom);

      // Recursively patch the new child
      patch(newChild as VnodeWithDom);
      continue;
    }

    // Set the dom property of the new child to the dom property of the old child
    newChild.dom = oldChild.dom;
    // If the v-keep prop is the same for both the new and old child, set the children of the new child to the children of the old child
    if ("v-keep" in newChild.props && newChild.props["v-keep"] === oldChild.props["v-keep"]) {
      newChild.children = oldChild.children;
      continue;
    }

    // Update the attributes of the new child based on the old child
    updateAttributes(newChild as VnodeWithDom, oldChild as VnodeWithDom);
    // Recursively patch the new and old children
    patch(newChild as VnodeWithDom, oldChild as VnodeWithDom);
  }

  // Remove any old children that are no longer present in the new tree
  for (; newTreeLength < oldTreeLength; newTreeLength++) {
    newVnode.dom.removeChild(oldTree[newTreeLength].dom);
  }
}

// Update the main Vnode
export function update(): void | string {
  // If the main Vnode exists
  if (mainVnode) {
    // Call any cleanup functions that are registered with the onCleanupSet set
    callSet(onCleanupSet);
    // Store a reference to the old main Vnode
    const oldMainVnode = mainVnode;
    // Create a new main Vnode with the main component as its only child
    mainVnode = new Vnode(oldMainVnode.tag, oldMainVnode.props, [mainComponent]) as VnodeWithDom;
    mainVnode.dom = oldMainVnode.dom;
    mainVnode.isSVG = oldMainVnode.isSVG;

    // Recursively patch the new and old main Vnodes
    patch(mainVnode, oldMainVnode);

    // Call any update or mount functions that are registered with the onUpdateSet or onMountSet set
    callSet(isMounted ? onUpdateSet : onMountSet);

    // Set the isMounted flag to true
    isMounted = true;

    // Reset the current vnode, oldVnode, and component properties
    current.vnode = null;
    current.oldVnode = null;
    current.component = null;

    // If the code is running in a Node.js environment, return the inner HTML of the main Vnode's dom element
    if (isNodeJs) {
      return mainVnode.dom.innerHTML;
    }
  }
}

// Update custom Vnode
// It is assumed that a first mount has already occurred, so,
// the oldVnode is not null and the dom property of the oldVnode is not null
// You need to set the dom property of the newVnode to the dom property of the oldVnode
// The same with the isSVG property
// Prefer this function over patch to allow for cleanup, onUpdate and onMount sets to be called
export function updateVnode(vnode: VnodeWithDom, oldVnode: VnodeWithDom): string | void {
  // Call any cleanup functions that are registered with the onCleanupSet set
  callSet(onCleanupSet);

  // Recursively patch the new and old main Vnodes
  patch(vnode, oldVnode);

  // Set the oldVnode's tag, props, children, dom, and isSVG properties to the newVnode's tag, props, children, dom, and isSVG properties
  // This is necessary to allow for the oldVnode to be used as the newVnode in the next update with the normal update function
  oldVnode.tag = vnode.tag;
  oldVnode.props = { ...vnode.props };
  oldVnode.children = [...vnode.children];
  oldVnode.dom = vnode.dom;
  oldVnode.isSVG = vnode.isSVG;

  // Call any update or mount functions that are registered with the onUpdateSet or onMountSet set
  callSet(isMounted ? onUpdateSet : onMountSet);

  // Set the isMounted flag to true
  isMounted = true;

  // Reset the current vnode, oldVnode, and component properties
  current.vnode = null;
  current.oldVnode = null;
  current.component = null;

  if (isNodeJs) {
    return vnode.dom.innerHTML;
  }
}

// Unmount the main Vnode
export function unmount() {
  // If the main Vnode exists
  if (mainVnode) {
    // Set the main component to a null Vnode
    mainComponent = new Vnode(() => null, {}, []) as VnodeComponentInterface;
    // Update the main Vnode
    const result = update();
    // Call any unmount functions that are registered with the onUnmountSet set
    callSet(onUnmountSet);

    // Remove any event listeners that were added to the main Vnode's dom element
    for (const name in eventListenerNames) {
      mainVnode.dom.removeEventListener(name.slice(2).toLowerCase(), eventListener);
      Reflect.deleteProperty(eventListenerNames, name);
    }

    // Reset the main component and main Vnode
    mainComponent = null;
    mainVnode = null;
    // Set the isMounted flag to false
    isMounted = false;
    // Reset the current vnode, oldVnode, and component properties
    current.vnode = null;
    current.oldVnode = null;
    current.component = null;
    // Return the result of updating the main Vnode
    return result;
  }
}
// This function takes in a DOM element or a DOM element selector and a component to be mounted on it.
export function mount(dom: string | DomElement, component: any) {
  // Check if the 'dom' argument is a string. If it is, select the first element that matches the given selector.
  // Otherwise, use the 'dom' argument as the container.
  const container =
    typeof dom === "string"
      ? isNodeJs
        ? createDomElement(dom, dom === "svg")
        : document.querySelectorAll(dom)[0]
      : dom;

  // Check if the 'component' argument is a Vnode component or a regular component.
  // If it's a regular component, create a new Vnode component using the 'component' argument as the tag.
  // If it's not a component at all, create a new Vnode component with the 'component' argument as the rendering function.
  const vnodeComponent = isVnodeComponent(component)
    ? component
    : isComponent(component)
    ? new Vnode(component, {}, [])
    : new Vnode(() => component, {}, []);

  // If a main component already exists and it's not the same as the current 'vnodeComponent', unmount it.
  if (mainComponent && mainComponent.tag !== vnodeComponent.tag) {
    unmount();
  }

  // Set the 'vnodeComponent' as the main component.
  mainComponent = vnodeComponent as VnodeComponentInterface;
  // Convert the container element to a Vnode.
  mainVnode = domToVnode(container);
  // Update the DOM with the new component.
  return update();
}

// This is a utility function for creating Vnode objects.
// It takes in a tag or component, and optional props and children arguments.
export const v: V = (tagOrComponent, props, ...children) => {
  // Return a new Vnode object using the given arguments.
  return new Vnode(tagOrComponent, props || {}, children);
};

// This utility function creates a fragment Vnode.
// It takes in a placeholder and the children arguments, returns only the children.
v.fragment = (_: VnodeProperties, ...children: Children) => children;
