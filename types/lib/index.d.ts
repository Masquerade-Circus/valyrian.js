export interface DomElement extends Element {
    [key: string]: any;
}
export interface Props {
    key?: string | number;
    data?: string;
    oncreate?: {
        (vnode: IVnode): never;
    };
    onupdate?: {
        (vnode: IVnode, oldVnode: IVnode): never;
    };
    onremove?: {
        (oldVnode: IVnode): never;
    };
    shouldupdate?: {
        (vnode: IVnode, oldVnode: IVnode): undefined | boolean;
    };
    "v-cleanup"?: Function;
    [key: string | number | symbol]: any;
}
export interface Children extends Array<IVnode | any> {
}
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
export declare type ValyrianComponent = Component | POJOComponent;
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
    cleanup: Function[];
    eventListener?: EventListener;
    mainVnode?: VnodeWithDom;
    component?: VnodeComponent;
    container?: DomElement;
    [key: string | number | symbol]: any;
}
export interface MountedValyrianApp extends ValyrianApp {
    eventListener: EventListener;
    mainVnode: VnodeWithDom;
    container: DomElement;
    component: VnodeComponent;
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
export interface Valyrian {
    (tagOrComponent: string | ValyrianComponent, props: Props, ...children: Children): IVnode | VnodeComponent;
    fragment: (props: Props, ...children: Children) => Children;
    current: Current;
    directives: Directives;
    reservedProps: ReservedProps;
}
export declare const Vnode: IVnode;
export declare function isVnode(component?: unknown): component is IVnode;
export declare function isComponent(component?: unknown | ValyrianComponent): component is ValyrianComponent;
export declare function isVnodeComponent(vnode?: unknown): vnode is VnodeComponent;
export declare const isNodeJs: boolean;
export declare const trust: (htmlString: string) => IVnode[];
export declare function cleanup(callback: Function): void;
export declare function mount(container: DomElement | string, component: ValyrianComponent | IVnode): any;
export declare function update(component?: ValyrianComponent | IVnode): any;
export declare function unmount(component?: ValyrianComponent | IVnode): string | undefined;
export declare function onremove(vnode: IVnode): void;
export declare function updateProperty(name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
export declare function directive(name: string, directive: Directive): void;
export declare const valyrian: Valyrian;
