export interface Props {
  [key: string]: any;
}

export interface DomElement extends Element {
  vProps: Props;
  [key: string]: any;
}

export interface Vnode {
  tag: string;
  props: Props;
  children: Children;
  dom?: DomElement;

  processed?: boolean;
}

export interface VnodeWithDom extends Vnode {
  dom: DomElement;
}

export interface Component {
  (props: Props, ...children: any[]): Vnode | Vnode[];
  [key: string]: any;
}

export interface ValyrianComponent {
  view: Component;
  props: Props | null;
  children: any[];
}

export interface Children extends Array<Vnode | any> {}

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
  component?: ValyrianComponent;
  vnode?: VnodeWithDom;
  oldVnode?: VnodeWithDom;
}

export interface Valyrian {
  (tagOrComponent: string | Component, props: Props, ...children: Children): Vnode | ValyrianComponent;
  fragment: (props: Props, ...children: Children) => Children;

  isNodeJs: boolean;
  isMounted: boolean;
  container?: Element | null;
  component?: ValyrianComponent | null;

  directives: Directives;
  reservedProps: ReservedProps;
  current: Current;

  trust: (htmlString: string) => Children;

  isVnode: (object?: unknown | Vnode) => object is Vnode;
  isComponent: (component?: unknown | ValyrianComponent) => component is ValyrianComponent;
  isValyrianComponent: (component?: unknown | ValyrianComponent) => component is ValyrianComponent;

  // onCleanup: (fn: Function) => void;
  // onUnmount: (fn: Function) => void;
  // onMount: (fn: Function) => void;
  // onUpdate: (fn: Function) => void;

  mount: (container: string | Element, normalComponent: Component | ValyrianComponent) => void | string;
  update: () => void | string;
  unmount: () => void | string;

  setAttribute: (name: string, value: any, vnode: VnodeWithDom, isSVG: boolean) => void;
  directive: (name: string, directive: Directive) => void;
  use: (plugin: Plugin, options?: Record<string | number | symbol, any>) => void | any;

  [key: string | number | symbol]: any;
}

export interface Plugin {
  (valyrian: Valyrian, options?: Record<string | string | symbol, any>): void | any;
}
