/*** Interfaces ***/

export interface DomElement extends Element {
  [key: string]: any;
}

export interface Props {
  key?: string | number;
  data?: string;
  oncreate?: { (vnode: IVnode): never };
  onupdate?: { (vnode: IVnode, oldVnode: IVnode): never };
  onremove?: { (oldVnode: IVnode): never };
  shouldupdate?: { (vnode: IVnode, oldVnode: IVnode): undefined | boolean };
  [key: string | number | symbol]: any;
}

export interface Children extends Array<IVnode | any> {}

export interface IVnode {
  new (tag: string, props: Props, children: IVnode[]): IVnode;
  tag: string;
  props: Props;
  children: Children;
  dom?: DomElement;
  isSVG?: boolean;
  processed?: boolean;
  component?: Component | POJOComponent;
  nodeValue?: string;
  [key: string | number | symbol]: any;
}

export interface Component {
  (props?: Record<string, any> | null, children?: Children): IVnode | Children;
  [key: string | number | symbol]: any;
}

export interface POJOComponent {
  view: Component;
  [key: string | number | symbol]: any;
}

export type ValyrianComponent = Component | POJOComponent;

export interface VnodeComponent extends IVnode {
  tag: "__component__";
  component: ValyrianComponent;
}

export interface VnodeWithDom extends IVnode {
  dom: DomElement;
}

export interface Directive {
  (value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
}

export interface ValyrianApp {
  isMounted: boolean;
  eventListenerNames: Record<string, true>;
  onCleanup: Function[];
  onUnmount: Function[];
  onMount: Function[];
  onUpdate: Function[];

  eventListener?: EventListener;
  mainVnode?: VnodeWithDom;
  container?: DomElement;

  [key: string | number | symbol]: any;
}

export interface MountedValyrianApp extends ValyrianApp {
  eventListener: EventListener;
  mainVnode: VnodeWithDom;
  container: DomElement;
}

export interface Current {
  app?: ValyrianApp;
  component?: ValyrianComponent;
  vnode?: VnodeWithDom;
  oldVnode?: VnodeWithDom;
}

export interface Directives {
  [key: string]: Directive;
}

export interface ReservedProps {
  [key: string]: true;
}

export interface Plugin {
  (valyrian: Valyrian, options?: Record<string | string | symbol, any>): void | any;
}

export interface Valyrian {
  (tagOrComponent: string | ValyrianComponent, props: Props, ...children: Children): IVnode | VnodeComponent;
  fragment: (props: Props, ...children: Children) => Children;
  current: Current;
  directives: Directives;
  reservedProps: ReservedProps;

  isVnode: (object?: unknown | IVnode) => object is IVnode;
  isComponent: (component?: unknown | ValyrianComponent) => component is ValyrianComponent;
  isVnodeComponent: (vnode?: unknown | VnodeComponent) => vnode is VnodeComponent;

  isNodeJs: boolean;
  trust: (htmlString: string) => IVnode[];

  onCleanup: (fn: Function) => void;
  onUnmount: (fn: Function) => void;
  onMount: (fn: Function) => void;
  onUpdate: (fn: Function) => void;

  mount: (container: DomElement | string, component: ValyrianComponent | IVnode) => void | string;
  update: (component: ValyrianComponent | IVnode) => void | string;
  unmount: (component: ValyrianComponent | IVnode) => void | string;

  setAttribute: (name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => void;
  directive: (name: string, directive: Directive) => void;
  use: (plugin: Plugin, options?: Record<string | number | symbol, any>) => void | any;

  [key: string | number | symbol]: any;
}

declare global {
  namespace JSX {
    type Element = IVnode;
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface HTMLAttributes<T> {
  [key: string]: any;
}
