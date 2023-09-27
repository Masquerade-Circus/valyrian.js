interface DefaultRecord extends Record<string | number | symbol, any> {
}
export interface VnodeProperties extends DefaultRecord {
    key?: string | number;
    state?: any;
}
export interface DomElement extends Element, DefaultRecord {
}
export interface VnodeInterface extends DefaultRecord {
    new (tag: string | Component | POJOComponent, props: VnodeProperties, children: Children): VnodeInterface;
    tag: string | Component | POJOComponent;
    props: VnodeProperties;
    children: Children;
    isSVG?: boolean;
    dom?: DomElement;
    processed?: boolean;
}
export interface VnodeWithDom extends VnodeInterface {
    dom: DomElement;
}
export interface Component extends DefaultRecord {
    (props?: VnodeProperties | null, ...children: any[]): VnodeInterface | Children | any;
}
export interface POJOComponent extends DefaultRecord {
    view: Component;
    props?: VnodeProperties | null;
    children?: any[];
}
export interface VnodeComponentInterface extends VnodeInterface {
    tag: Component | POJOComponent;
    props: VnodeProperties;
    children: Children;
}
export interface Children extends Array<VnodeInterface | VnodeComponentInterface | any> {
}
export interface Directive {
    (value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | boolean;
}
export interface Directives extends Record<string, Directive> {
}
export interface ReservedProps extends Record<string, true> {
}
export interface Current {
    component: Component | POJOComponent | null;
    vnode: VnodeWithDom | null;
    oldVnode?: VnodeWithDom | null;
    event: Event | null;
}
export interface V {
    (tagOrComponent: string | Component | POJOComponent, props: VnodeProperties | null, ...children: Children): VnodeInterface | VnodeComponentInterface;
    fragment(_: any, ...children: Children): Children;
}
export declare let isNodeJs: boolean;
export declare function createDomElement(tag: string, isSVG?: boolean): DomElement;
export declare const Vnode: VnodeInterface;
export declare function isComponent(component: unknown): component is Component;
export declare const isVnode: (object?: unknown | VnodeInterface) => object is VnodeInterface;
export declare const isVnodeComponent: (object?: unknown | VnodeComponentInterface) => object is VnodeComponentInterface;
export declare function domToVnode(dom: any): VnodeWithDom;
export declare function trust(htmlString: string): unknown[];
export declare const current: Current;
export declare const reservedProps: Record<string, true>;
export declare function onMount(callback: Function): void;
export declare function onUpdate(callback: Function): void;
export declare function onCleanup(callback: Function): void;
export declare function onUnmount(callback: Function): void;
export declare const directives: Directives;
export declare function directive(name: string, directive: Directive): void;
export declare function setAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
export declare function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
export declare function patch(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
export declare function update(): void | string;
export declare function updateVnode(vnode: VnodeWithDom, oldVnode: VnodeWithDom): string | void;
export declare function unmount(): string | void;
export declare function mount(dom: string | DomElement, component: any): string | void;
export declare const v: V;
export {};
//# sourceMappingURL=index.d.ts.map