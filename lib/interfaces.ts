/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
declare module "valyrian.js" {
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
  export interface Children extends Array<VnodeInterface | VnodeComponentInterface | any> {}
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
    (tagOrComponent: string | Component | POJOComponent, props: Props | null, ...children: Children):
      | VnodeInterface
      | VnodeComponentInterface;
    fragment(_: any, ...children: Children): Children;
  }
  export let isNodeJs: boolean;
  export function createDomElement(tag: string, isSVG?: boolean): DomElement;
  export const Vnode: VnodeInterface;
  export function isComponent(component: any): component is Component;
  export const isVnode: (object?: unknown | VnodeInterface) => object is VnodeInterface;
  export const isVnodeComponent: (object?: unknown | VnodeComponentInterface) => object is VnodeComponentInterface;
  export function domToVnode(dom: any): VnodeWithDom;
  export function trust(htmlString: string): any;
  export const current: Current;
  export const reservedProps: Record<string, true>;
  export function onMount(callback: any): void;
  export function onUpdate(callback: any): void;
  export function onCleanup(callback: any): void;
  export function onUnmount(callback: any): void;
  export const directives: Directives;
  export function directive(name: string, directive: Directive): void;
  export function setAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
  export function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
  export function patch(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void;
  export function update(): void | string;
  export function updateVnode(vnode: VnodeWithDom, oldVnode: VnodeWithDom): string | void;
  export function unmount(): string | void;
  export function mount(dom: any, component: any): string | void;
  export const v: V;
}
