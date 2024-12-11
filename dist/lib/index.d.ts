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
    (value: any, vnode: VnodeWithDom, oldProps: Properties | null): false | void | any;
}
export declare const isNodeJs: boolean;
export declare class Vnode {
    tag: string | Component | POJOComponent;
    props: null | Properties;
    children: Children;
    dom?: DomElement | undefined;
    isSVG?: boolean | undefined;
    constructor(tag: string | Component | POJOComponent, props: null | Properties, children: Children, dom?: DomElement | undefined, isSVG?: boolean | undefined);
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
export declare function setPropNameReserved(name: string): void;
export declare function setAttribute(name: string, value: any, newVnode: VnodeWithDom): void;
export declare function updateAttributes(newVnode: VnodeWithDom, oldProps: Properties | null): void;
export declare function createElement(tag: string, isSVG: boolean): DomElement;
export declare function updateVnode(vnode: VnodeWithDom): string | void;
export declare function update(): string;
export declare function debouncedUpdate(): void;
export declare function unmount(): string;
export declare function mount(dom: string | DomElement, component: ValyrianComponent | VnodeComponentInterface | any): string;
export {};
//# sourceMappingURL=index.d.ts.map