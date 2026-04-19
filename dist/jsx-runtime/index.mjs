// lib/jsx-runtime/index.ts
import {
  Vnode,
  fragment
} from "valyrian.js";
function jsx(tag, props, key) {
  let children = [];
  if ("children" in props) {
    children = [props.children];
    Reflect.deleteProperty(props, "children");
  }
  return new Vnode(tag, props, children, key);
}
function jsxs(tag, props, key) {
  let children = props.children;
  Reflect.deleteProperty(props, "children");
  return new Vnode(tag, props, children, key);
}
var Fragment = fragment;
export {
  Fragment,
  jsx,
  jsxs
};
