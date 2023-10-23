declare global {
    var document: Document;
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}
interface DefaultRecord extends Record<string | number | symbol, any> {
}
export interface VnodeProperties extends DefaultRecord {
    key?: string | number;
}
export interface DomElement extends Element, DefaultRecord {
}
export interface Component extends DefaultRecord {
    (props: VnodeProperties, children: any[]): Vnode | any;
}
export interface POJOComponent extends DefaultRecord {
    view: Component;
}
export type ValyrianComponent = Component | POJOComponent;
export interface VnodeComponentInterface extends Vnode {
    tag: ValyrianComponent;
}
export interface Children extends Array<Vnode | VnodeComponentInterface | ValyrianComponent | any> {
}
export interface Directive {
    (vnode: VnodeWithDom, oldProps: VnodeProperties | null): void | boolean;
}
export declare const isNodeJs: boolean;
export declare class Vnode {
    tag: string | Component | POJOComponent;
    props: null | VnodeProperties;
    children: Children;
    dom?: DomElement | undefined;
    isSVG?: boolean | undefined;
    constructor(tag: string | Component | POJOComponent, props: null | VnodeProperties, children: Children, dom?: DomElement | undefined, isSVG?: boolean | undefined);
}
export interface VnodeWithDom extends Vnode {
    tag: string;
    dom: DomElement;
    props: VnodeProperties;
}
export declare const isComponent: (component: unknown) => component is Component;
export declare const isVnode: (object?: unknown) => object is Vnode;
export declare const isVnodeComponent: (object?: unknown) => object is VnodeComponentInterface;
export declare function domToVnode(dom: any): VnodeWithDom;
export declare function trust(htmlString: string): VnodeWithDom[];
export declare const current: {
    vnode: Vnode | null;
    component: ValyrianComponent | null;
    event: Event | null;
};
export declare const reservedProps: Set<string>;
export declare const onMount: (callback: Function) => false | Set<Function>;
export declare const onUpdate: (callback: Function) => Set<Function>;
export declare const onCleanup: (callback: Function) => Set<Function>;
export declare const onUnmount: (callback: Function) => false | Set<Function>;
export declare const directives: Record<string, Directive>;
export declare function directive(name: string, directive: Directive): void;
export declare function setAttribute(name: string, value: any, newVnode: VnodeWithDom): void;
export declare function patch(newVnode: VnodeWithDom): void;
export declare function update(): void | string;
export declare function updateVnode(vnode: VnodeWithDom): string | void;
export declare function unmount(): string | void;
export declare function mount(dom: string | DomElement, component: any): string | void;
export declare function v(tagOrComponent: string | Component, props: VnodeProperties, ...children: Children): Vnode;
export declare namespace v {
    var fragment: (_: VnodeProperties, ...children: Children) => Children;
}
export {};
//# sourceMappingURL=index.d.ts.map