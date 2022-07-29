export interface Props {
    key?: string | number;
    state?: any;
    oncreate?: {
        (vnode: VnodeInterface): never;
    };
    onupdate?: {
        (vnode: VnodeInterface, oldVnode: VnodeInterface): never;
    };
    onremove?: {
        (oldVnode: VnodeInterface): never;
    };
    shouldupdate?: {
        (vnode: VnodeInterface, oldVnode: VnodeInterface): undefined | boolean;
    };
    [key: string | number | symbol]: any;
}
export interface DomElement extends Element {
    [key: string]: any;
}
export interface VnodeInterface {
    new (tag: string, props: Props, children: Children): VnodeInterface;
    tag: string;
    props: Props;
    children: Children;
    isSVG?: boolean;
    dom?: DomElement;
    processed?: boolean;
    [key: string | number | symbol]: any;
}
export interface VnodeTextInterface {
    new (nodeValue: string): VnodeTextInterface;
    dom?: DomElement;
    nodeValue: string;
}
export interface VnodeWithDom extends VnodeInterface {
    dom: DomElement;
}
export interface Component {
    (props?: Props | null, ...children: any[]): VnodeInterface | Children | any;
    [key: string]: any;
}
export interface ValyrianComponent {
    view: Component;
    props?: Props | null;
    children?: any[];
    [key: string]: any;
}
export interface VnodeComponentInterface {
    new (component: Component | ValyrianComponent, props: Props, children: Children): VnodeComponentInterface;
    component: Component | ValyrianComponent;
    props: Props;
    children: Children;
}
export interface Children extends Array<VnodeInterface | VnodeTextInterface | VnodeComponentInterface | any> {
}
export interface Directive {
    (value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | boolean;
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
    (tagOrComponent: string | Component | ValyrianComponent, props: Props | null, ...children: Children): VnodeInterface | VnodeComponentInterface;
    fragment: (_: any, ...children: Children) => Children;
    isNodeJs: boolean;
    isMounted: boolean;
    component: Component | ValyrianComponent | null;
    mainVnode: VnodeWithDom | null;
    directives: Directives;
    reservedProps: ReservedProps;
    current: Current;
    trust: (htmlString: string) => Children;
    isVnode: (object?: unknown | VnodeInterface) => object is VnodeInterface;
    isVnodeComponent: (object?: unknown) => object is VnodeComponentInterface;
    isComponent: (component?: unknown | Component | ValyrianComponent) => component is ValyrianComponent;
    isValyrianComponent: (component?: unknown) => component is ValyrianComponent;
    onCleanup: (fn: Function) => void;
    onUnmount: (fn: Function) => void;
    onMount: (fn: Function) => void;
    onUpdate: (fn: Function) => void;
    patch: (newParentVnode: VnodeWithDom, oldParentVnode?: VnodeWithDom | undefined) => void;
    mount: (container: string | Element, normalComponent: Component | ValyrianComponent) => void | string;
    update: () => void | string;
    unmount: () => void | string;
    setAttribute: (name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => void;
    directive: (name: string, directive: Directive) => void;
    use: (plugin: Plugin, options?: Record<string | number | symbol, any>) => void | any;
    [key: string | number | symbol]: any;
}
//# sourceMappingURL=interfaces.d.ts.map