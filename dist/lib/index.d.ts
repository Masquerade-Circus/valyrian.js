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
type LifecycleCleanup = () => void;
type OnCreateCallback = () => void | LifecycleCleanup | Promise<void>;
type OnUpdateCallback = () => void | LifecycleCleanup;
export interface Properties extends DefaultRecord {
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
export declare const fragment: unique symbol;
export type Fragment = typeof fragment;
export type VnodeTag = string | ValyrianComponent | Fragment;
declare const OLD_CHILD_COMPONENTS: unique symbol;
declare const CHILD_COMPONENTS: unique symbol;
declare const HAS_KEYS: unique symbol;
declare const IS_SVG: unique symbol;
declare const LIFECYCLE: unique symbol;
type VnodeLifecycle = {
    create?: Set<Function>;
    cleanup?: Set<Function>;
    update?: Set<Function>;
    remove?: Set<Function>;
};
declare class MultipleComponentIdentities {
    #private;
    readonly entries: Set<ValyrianComponent>;
    constructor(entries: Set<ValyrianComponent>);
    static is(identities?: ComponentIdentities): identities is MultipleComponentIdentities;
}
type ComponentIdentities = ValyrianComponent | MultipleComponentIdentities;
export declare class Vnode {
    tag: VnodeTag;
    props: null | Properties;
    children: Children;
    key?: string | number | undefined;
    dom?: DomElement | undefined;
    [IS_SVG]?: boolean;
    [OLD_CHILD_COMPONENTS]?: ComponentIdentities;
    [CHILD_COMPONENTS]?: ComponentIdentities;
    [HAS_KEYS]?: boolean;
    [LIFECYCLE]?: VnodeLifecycle;
    constructor(tag: VnodeTag, props: null | Properties, children: Children, key?: string | number | undefined, dom?: DomElement | undefined, isSVG?: boolean, oldChildComponents?: Set<ValyrianComponent>, childComponents?: Set<ValyrianComponent>, hasKeys?: boolean, oncreate?: Set<Function>, oncleanup?: Set<Function>, onupdate?: Set<Function>, onremove?: Set<Function>);
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
export declare function v(tagOrComponent: VnodeTag, props: Properties | null, ...children: Children): Vnode;
export declare namespace v {
    var fragment: (_: any, ...children: Children) => Children;
}
export declare function hydrateDomToVnode(dom: any): VnodeWithDom | string | null | void;
export declare function trust(htmlString: string): (string | void | VnodeWithDom | null)[];
export declare const current: {
    oldVnode: Vnode | null;
    vnode: Vnode | null;
    component: ValyrianComponent | null;
    event: Event | null;
};
export declare const reservedProps: Set<string>;
export declare const onCreate: (callback: OnCreateCallback) => void;
export declare const onUpdate: (callback: OnUpdateCallback) => void;
export declare const onCleanup: (callback: Function) => void;
export declare const onRemove: (callback: Function) => void;
export declare const directives: Record<string, Directive>;
export declare function directive(name: string, directive: Directive): void;
export declare function setPropNameReserved(name: string): void;
export declare function preventUpdate(): void;
export declare function setAttribute(name: string, value: any, newVnode: VnodeWithDom): void;
export declare function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | false;
export declare function createElement(tag: string, isSVG?: boolean): DomElement;
export declare function updateVnode(vnode: VnodeWithDom, shouldCleanup?: boolean): string | void;
export declare function update(): string;
export declare function debouncedUpdate(timeout?: number): void;
export declare function unmount(): string;
export declare function mount(dom: string | DomElement, component: ValyrianComponent | VnodeComponentInterface | any): string;
export {};
//# sourceMappingURL=index.d.ts.map