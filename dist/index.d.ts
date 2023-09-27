export interface VnodeProperties {
    key?: string | number;
    state?: any;
    [key: string | number | symbol]: any;
}
export interface DomElement extends Element {
    [key: string]: any;
}
export interface VnodeInterface {
    new (tag: string | Component | POJOComponent, props: VnodeProperties, children: Children): VnodeInterface;
    tag: string | Component | POJOComponent;
    props: VnodeProperties;
    children: Children;
    isSVG?: boolean;
    dom?: DomElement;
    processed?: boolean;
    [key: string | number | symbol]: any;
}
export interface VnodeWithDom extends VnodeInterface {
    dom: DomElement;
}
export interface Component {
    (props?: VnodeProperties | null, ...children: any[]): VnodeInterface | Children | any;
    [key: string]: any;
}
export interface POJOComponent {
    view: Component;
    props?: VnodeProperties | null;
    children?: any[];
    [key: string]: any;
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
export interface Directives {
    [key: string]: Directive;
}
export interface ReservedProps {
    [key: string]: true;
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
export declare const Vnode: VnodeInterface;
export declare const isVnode: (object?: unknown | VnodeInterface) => object is VnodeInterface;
export declare const isVnodeComponent: (object?: unknown | VnodeComponentInterface) => object is VnodeComponentInterface;
export declare const current: Current;
export declare const reservedProps: Record<string, true>;
export declare const directives: Directives;
export declare const v: V;
//# sourceMappingURL=index.d.ts.map