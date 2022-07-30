declare module "Valyrian" {
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
        new (tag: string, props: Props, children: Children): VnodeInterface;
        tag: string;
        props: Props;
        children: Children;
        isSVG?: boolean;
        dom?: DomElement;
        processed?: boolean;
        [key: string | number | symbol]: any;
    }
    interface VnodeTextInterface {
        new (nodeValue: string): VnodeTextInterface;
        dom?: DomElement;
        nodeValue: string;
    }
    interface VnodeWithDom extends VnodeInterface {
        dom: DomElement;
    }
    interface Component {
        (props?: Props | null, ...children: any[]): VnodeInterface | Children | any;
        [key: string]: any;
    }
    interface ValyrianComponent {
        view: Component;
        props?: Props | null;
        children?: any[];
        [key: string]: any;
    }
    interface VnodeComponentInterface {
        new (component: Component | ValyrianComponent, props: Props, children: Children): VnodeComponentInterface;
        component: Component | ValyrianComponent;
        props: Props;
        children: Children;
    }
    interface Children extends Array<VnodeInterface | VnodeTextInterface | VnodeComponentInterface | any> {
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
        component?: Component | ValyrianComponent | null;
        vnode?: VnodeWithDom | null;
        oldVnode?: VnodeWithDom | null;
    }
    interface Plugin {
        (valyrian: Valyrian, options?: Record<string | string | symbol, any>): void | any;
    }
    interface Valyrian {
        (tagOrComponent: string | Component | ValyrianComponent, props: Props | null, ...children: Children): VnodeInterface | VnodeComponentInterface;
        fragment(_: any, ...children: Children): Children;
        isNodeJs: boolean;
        isMounted: boolean;
        component: Component | ValyrianComponent | VnodeComponentInterface | null;
        mainVnode: VnodeWithDom | null;
        directives: Directives;
        reservedProps: ReservedProps;
        current: Current;
        trust(htmlString: string): Children;
        isVnode(object?: unknown | VnodeInterface): object is VnodeInterface;
        isVnodeComponent(object?: unknown): object is VnodeComponentInterface;
        isComponent(component?: unknown | Component | ValyrianComponent): component is ValyrianComponent;
        isValyrianComponent(component?: unknown): component is ValyrianComponent;
        onCleanup(fn: Function): void;
        onUnmount(fn: Function): void;
        onMount(fn: Function): void;
        onUpdate(fn: Function): void;
        patch(newParentVnode: VnodeWithDom, oldParentVnode?: VnodeWithDom | undefined): void;
        mount(container: string | Element, normalComponent: Component | ValyrianComponent | VnodeComponentInterface): void | string;
        update(): void | string;
        unmount(): void | string;
        setAttribute(name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
        directive(name: string, directive: Directive): void;
        use(plugin: Plugin, options?: Record<string | number | symbol, any>): void | any;
        [key: string | number | symbol]: any;
    }
}
//# sourceMappingURL=interfaces.d.ts.map