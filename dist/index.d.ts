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
    new (tag: string | Component | POJOComponent, props: Props, children: Children): VnodeInterface;
    tag: string | Component | POJOComponent;
    props: Props;
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
    (props?: Props | null, ...children: any[]): VnodeInterface | Children | any;
    [key: string]: any;
}
export interface POJOComponent {
    view: Component;
    props?: Props | null;
    children?: any[];
    [key: string]: any;
}
export interface VnodeComponentInterface extends VnodeInterface {
    tag: Component | POJOComponent;
    props: Props;
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
}
export interface V {
    (tagOrComponent: string | Component | POJOComponent, props: Props | null, ...children: Children): VnodeInterface | VnodeComponentInterface;
    fragment(_: any, ...children: Children): Children;
}
export declare let isNodeJs: boolean;
export declare function createDomElement(tag: string, isSVG?: boolean): DomElement;
export declare const Vnode: VnodeInterface;
export declare function isComponent(component: any): component is Component;
export declare const isVnode: (object?: unknown | VnodeInterface) => object is VnodeInterface;
export declare const isVnodeComponent: (object?: unknown | VnodeComponentInterface) => object is VnodeComponentInterface;
export declare function trust(htmlString: string): any;
export declare const current: Current;
export declare const reservedProps: Record<string, true>;
export declare function onMount(callback: any): void;
export declare function onUpdate(callback: any): void;
export declare function onCleanup(callback: any): void;
export declare function onUnmount(callback: any): void;
export declare const directives: Directives;
export declare function directive(name: string, directive: Directive): void;
export declare function setAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
export declare function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
export declare function patch(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
export declare function update(): void | string;
export declare function unmount(): string | void;
export declare function mount(dom: any, component: any): string | void;
export declare const v: V;
//# sourceMappingURL=index.d.ts.map