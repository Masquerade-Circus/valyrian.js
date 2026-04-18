import {
  Vnode,
  type Component,
  fragment,
  type Fragment as FragmentSentinel,
  type POJOComponent,
  type Properties,
  Children
} from "../index";

type JsxTag = string | Component | POJOComponent | FragmentSentinel;
type JsxProps = Properties & { children?: any };
type JsxPropsWithChildren = Properties & { children: any[] };

export function jsx(tag: JsxTag, props: JsxProps, key?: string | number) {
  let children: Children = [];

  if ("children" in props) {
    children = [props.children];
    Reflect.deleteProperty(props, "children");
  }

  return new Vnode(tag, props as Properties, children, key);
}

export function jsxs(tag: JsxTag, props: JsxPropsWithChildren, key?: string | number) {
  let children: Children = props.children;
  Reflect.deleteProperty(props, "children");
  return new Vnode(tag, props as Properties, children, key);
}

export const Fragment: FragmentSentinel = fragment;

export namespace JSX {
  export interface IntrinsicElements extends Record<string | number | symbol, any> {}
  export type Element = Vnode | string | number | null | undefined | boolean | Promise<any>;
  export type ComponentReturnType = string | number | null | undefined | boolean | Element | Element[];
}
