declare type VnodeOrUnknown = VnodeComponent | Vnode | TextVnode | any;
declare type DomAttribute = {
    nodeName: string;
    nodeValue: string;
};
declare type DomElement = (HTMLElement | SVGElement) & Record<string, any>;
declare type Props = {
    key?: string | number;
    data?: string;
    oncreate?: {
        (vnode: Vnode): never;
    };
    onupdate?: {
        (vnode: Vnode, oldVnode: Vnode | TextVnode): never;
    };
    onremove?: {
        (oldVnode: Vnode): never;
    };
    onbeforeupdate?: {
        (vnode: Vnode, oldVnode: Vnode | TextVnode): undefined | boolean;
    };
} & Record<string, any>;
declare type Component = (props?: Record<string, any> | null, children?: VnodeOrUnknown) => VnodeOrUnknown | VnodeOrUnknown[];
declare type ValyrianComponent = Component | (Record<string, any> & {
    view: Component;
});
declare type Current = {
    parentVnode?: Vnode;
    oldParentVnode?: Vnode;
    component?: VnodeComponent;
};
interface Plugin {
    (v: Valyrian, options?: Record<string, any>): never;
}
interface Directive {
    (value: any, vnode: Vnode, oldVnode?: Vnode | TextVnode): void | boolean;
}
interface Vnode {
    name: string;
    props: Props;
    children: VnodeOrUnknown[];
    dom?: DomElement;
    onCleanup?: FunctionConstructor[];
    isSVG?: boolean;
    processed?: boolean;
}
declare class Vnode implements Vnode {
    name: string;
    props: Props;
    children: VnodeOrUnknown[];
    dom?: DomElement;
    onCleanup?: FunctionConstructor[];
    isSVG?: boolean;
    processed?: boolean;
    constructor(name: string, props: Props, children: VnodeOrUnknown);
}
interface TextVnode {
    dom?: Text;
    nodeValue: string;
}
declare class TextVnode implements TextVnode {
    dom?: Text;
    nodeValue: string;
    constructor(nodeValue: string);
}
interface VnodeComponent {
    component: ValyrianComponent;
    props: Props;
    children: VnodeOrUnknown[];
}
declare class VnodeComponent implements VnodeComponent {
    component: ValyrianComponent;
    props: Props;
    children: VnodeOrUnknown[];
    constructor(component: ValyrianComponent, props: Props, children: VnodeOrUnknown[]);
}
interface Valyrian {
    (tagOrComponent: string | ValyrianComponent, props?: Props | null, children?: VnodeOrUnknown): Vnode | VnodeComponent;
    isMounted: boolean;
    isNode: boolean;
    reservedWords: string[];
    current: Current;
    trust: (htmlString: string) => Vnode[];
    usePlugin: (plugin: Plugin, options: Record<string, any>) => void;
    onCleanup: (callback: typeof Function) => void;
    updateProperty: (name: string, newVnode: Vnode & {
        dom: DomElement;
    }, oldNode: Vnode & {
        dom: DomElement;
    }) => void;
    update: (props?: Props | null, ...children: VnodeOrUnknown) => string | void;
    mount: (container: string | DomElement, component: ValyrianComponent, props?: Props | null, ...children: VnodeOrUnknown[]) => string | void;
    unMount: () => string | boolean | void;
    directive: (directive: string, handler: Directive) => void;
    newInstance: () => Valyrian;
    [x: string]: any;
}
declare let isNode: boolean;
declare function createElement(tagName: string, isSVG?: boolean): DomElement;
declare function domToVnode(dom: DomElement): Vnode & {
    dom: DomElement;
};
declare const trust: (htmlString: string) => Vnode[];
declare function valyrian(): Valyrian;
