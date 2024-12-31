declare global {
    var document: Document;
    namespace JSX {
        interface IntrinsicElements extends DefaultRecord {
        }
        type Element = ReturnType<typeof v | ((...args: any) => string | number | null | undefined | boolean | Promise<any>)>;
        type ComponentReturnType = string | number | null | undefined | boolean | Element | Element[];
    }
}
interface DefaultRecord extends Record<string | number | symbol, any> {
}
export interface Properties extends DefaultRecord {
    key?: string | number;
}
export interface DomElement extends Element, DefaultRecord {
}
export interface Component extends DefaultRecord {
    (props: Properties, children: any[]): Vnode | any;
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
    (value: any, vnode: VnodeWithDom, oldProps?: Properties): false | void | any;
}
export declare const isNodeJs: boolean;
export declare class Vnode {
    tag: string | Component | POJOComponent;
    props: null | Properties;
    children: Children;
    dom?: DomElement | undefined;
    isSVG?: boolean | undefined;
    directComponents?: Set<ValyrianComponent> | undefined;
    hasKeys?: boolean | undefined;
    oncreate?: Set<Function> | undefined;
    oncleanup?: Set<Function> | undefined;
    onupdate?: Set<Function> | undefined;
    onremove?: Set<Function> | undefined;
    constructor(tag: string | Component | POJOComponent, props: null | Properties, children: Children, dom?: DomElement | undefined, isSVG?: boolean | undefined, directComponents?: Set<ValyrianComponent> | undefined, hasKeys?: boolean | undefined, oncreate?: Set<Function> | undefined, oncleanup?: Set<Function> | undefined, onupdate?: Set<Function> | undefined, onremove?: Set<Function> | undefined);
}
export interface VnodeWithDom extends Vnode {
    tag: string;
    dom: DomElement;
    props: Properties;
}
export declare const isPOJOComponent: (component: unknown) => component is POJOComponent;
export declare const isComponent: (component: unknown) => component is Component;
export declare const isVnode: (object?: unknown) => object is Vnode;
export declare const isVnodeComponent: (object?: unknown) => object is VnodeComponentInterface;
export declare function v(tagOrComponent: string | ValyrianComponent, props: Properties | null, ...children: Children): Vnode;
export declare namespace v {
    var fragment: (_: Properties, ...children: Children) => Children;
}
export declare function hidrateDomToVnode(dom: any): VnodeWithDom | void;
export declare function trust(htmlString: string): (void | VnodeWithDom)[];
export declare const current: {
    oldVnode: Vnode | null;
    vnode: Vnode | null;
    component: ValyrianComponent | null;
    event: Event | null;
};
export declare const reservedProps: Set<string>;
export declare const onCreate: (callback: Function) => void;
export declare const onUpdate: (callback: Function) => void;
export declare const onCleanup: (callback: Function) => void;
export declare const onRemove: (callback: Function) => void;
export declare const directives: Record<string, Directive>;
export declare function directive(name: string, directive: Directive): void;
export declare function setPropNameReserved(name: string): void;
export declare function setAttribute(name: string, value: any, newVnode: VnodeWithDom): void;
export declare function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
export declare function createElement(tag: string, isSVG: boolean): DomElement;
export declare function updateVnode(vnode: VnodeWithDom, shouldCleanup?: boolean): string | void;
export declare function update(): string;
export declare function debouncedUpdate(timeout?: number): void;
export declare function unmount(): string;
export declare function mount(dom: string | DomElement, component: ValyrianComponent | VnodeComponentInterface | any): string;
export {};
//# sourceMappingURL=index.d.ts.map