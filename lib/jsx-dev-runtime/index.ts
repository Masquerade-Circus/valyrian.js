import {
  Vnode,
  type Component,
  type Fragment as FragmentSentinel,
  type POJOComponent,
  type Properties
} from "../index";

export { Fragment, jsx, jsxs } from "../jsx-runtime";
export type { JSX } from "../jsx-runtime";

type JsxTag = string | Component | POJOComponent | FragmentSentinel;
type JsxProps = Properties & { children?: any };

export function jsxDEV(
  type: JsxTag,
  props: JsxProps,
  key?: string | number,
  isStaticChildren?: boolean,
  source?: unknown,
  self?: unknown
) {
  let children = [];

  if ("children" in props) {
    children = Array.isArray(props.children) ? props.children : [props.children];
    Reflect.deleteProperty(props, "children");
  }

  return new Vnode(type, props as Properties, children, key);
}
