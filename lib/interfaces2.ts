/* eslint-disable no-unused-vars */
export interface Props {
  [key: string]: any;
}

export interface DomElement extends Element {
  [key: string]: any;
}

export interface Vnode {
  new (tag: string, props: Props, children: Children): Vnode;
  tag: string;
  props: Props;
  children: Children;
  view?: Component;
  nodeValue?: string;
  dom?: DomElement;

  processed?: boolean;

  [key: string]: any;
}

export interface VnodeText {
  new (nodeValue: string): VnodeText;
  dom?: DomElement;
  nodeValue: string;
}

export interface VnodeWithDom extends Vnode {
  dom: DomElement;
}

export interface Component {
  (props?: Props | null, ...children: any[]): Vnode | Children | any;
  [key: string]: any;
}

export interface ValyrianComponent {
  view: Component;
  props?: Props | null;
  children?: any[];
  [key: string]: any;
}

export interface VnodeComponent {
  new (component: Component | ValyrianComponent, props: Props, children: Children): VnodeComponent;
  component: Component | ValyrianComponent;
  props: Props;
  children: Children;
}

export interface Children extends Array<Vnode | VnodeComponent | any> {}

export interface Directive {
  (value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
}

export interface Directives {
  [key: string]: Directive;
}

export interface ReservedProps {
  [key: string]: true;
}

export interface Current {
  component?: Component | ValyrianComponent | null;
  vnode?: VnodeWithDom | null;
  oldVnode?: VnodeWithDom | null;
}

export interface Plugin {
  (valyrian: Valyrian, options?: Record<string | string | symbol, any>): void | any;
}

export interface Valyrian {
  (tagOrComponent: string | Component | ValyrianComponent, props: Props | null, ...children: Children): Vnode | VnodeComponent;
  fragment: (_: any, ...children: Children) => Children;

  isNodeJs: boolean;
  isMounted: boolean;
  component: Component | ValyrianComponent | null;
  mainVnode: VnodeWithDom | null;

  directives: Directives;
  reservedProps: ReservedProps;
  current: Current;

  trust: (htmlString: string) => Children;

  isVnode: (object?: unknown | Vnode) => object is Vnode;
  isComponent: (component?: unknown | Component | ValyrianComponent) => component is ValyrianComponent;

  onCleanup: (fn: Function) => void;
  onUnmount: (fn: Function) => void;
  onMount: (fn: Function) => void;
  onUpdate: (fn: Function) => void;

  mount: (container: string | Element, normalComponent: Component | ValyrianComponent) => void | string;
  update: () => void | string;
  unmount: () => void | string;

  setAttribute: (name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom, isSVG?: boolean) => void;
  directive: (name: string, directive: Directive) => void;
  use: (plugin: Plugin, options?: Record<string | number | symbol, any>) => void | any;

  [key: string | number | symbol]: any;
}
