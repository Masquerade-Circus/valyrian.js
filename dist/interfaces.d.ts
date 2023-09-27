declare module "valyrian.js" {
    interface Props {
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
    interface DomElement extends Element {
        [key: string]: any;
    }
    interface VnodeInterface {
        new (tag: string | Component | POJOComponent, props: Props, children: Children): VnodeInterface;
        tag: string | Component | POJOComponent;
        props: Props;
        children: Children;
        isSVG?: boolean;
        dom?: DomElement;
        processed?: boolean;
        [key: string | number | symbol]: any;
    }
    interface VnodeWithDom extends VnodeInterface {
        dom: DomElement;
    }
    interface Component {
        (props?: Props | null, ...children: any[]): VnodeInterface | Children | any;
        [key: string]: any;
    }
    interface POJOComponent {
        view: Component;
        props?: Props | null;
        children?: any[];
        [key: string]: any;
    }
    interface VnodeComponentInterface extends VnodeInterface {
        tag: Component | POJOComponent;
        props: Props;
        children: Children;
    }
    interface Children extends Array<VnodeInterface | VnodeComponentInterface | any> {
    }
    interface Directive {
        (value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | boolean;
    }
    interface Directives {
        [key: string]: Directive;
    }
    interface ReservedProps {
        [key: string]: true;
    }
    interface Current {
        component: Component | POJOComponent | null;
        vnode: VnodeWithDom | null;
        oldVnode?: VnodeWithDom | null;
        event: Event | null;
    }
    interface V {
        (tagOrComponent: string | Component | POJOComponent, props: Props | null, ...children: Children): VnodeInterface | VnodeComponentInterface;
        fragment(_: any, ...children: Children): Children;
    }
    let isNodeJs: boolean;
    function createDomElement(tag: string, isSVG?: boolean): DomElement;
    const Vnode: VnodeInterface;
    function isComponent(component: any): component is Component;
    const isVnode: (object?: unknown | VnodeInterface) => object is VnodeInterface;
    const isVnodeComponent: (object?: unknown | VnodeComponentInterface) => object is VnodeComponentInterface;
    function domToVnode(dom: any): VnodeWithDom;
    function trust(htmlString: string): any;
    const current: Current;
    const reservedProps: Record<string, true>;
    function onMount(callback: any): void;
    function onUpdate(callback: any): void;
    function onCleanup(callback: any): void;
    function onUnmount(callback: any): void;
    const directives: Directives;
    function directive(name: string, directive: Directive): void;
    function setAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
    function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
    function patch(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
    function update(): void | string;
    function updateVnode(vnode: VnodeWithDom, oldVnode: VnodeWithDom): string | void;
    function unmount(): string | void;
    function mount(dom: any, component: any): string | void;
    const v: V;
}
export {};
//# sourceMappingURL=interfaces.d.ts.map