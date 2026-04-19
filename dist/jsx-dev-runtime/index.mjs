// lib/jsx-dev-runtime/index.ts
import {
  Vnode
} from "valyrian.js";
import { Fragment, jsx, jsxs } from "valyrian.js/jsx-runtime";
function jsxDEV(type, props, key, isStaticChildren, source, self) {
  let children = [];
  if ("children" in props) {
    children = Array.isArray(props.children) ? props.children : [props.children];
    Reflect.deleteProperty(props, "children");
  }
  return new Vnode(type, props, children, key);
}
export {
  Fragment,
  jsx,
  jsxDEV,
  jsxs
};
