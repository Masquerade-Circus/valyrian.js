import { Vnode, type Component, type Fragment as FragmentSentinel, type POJOComponent, type Properties } from "valyrian.js";
export { Fragment, jsx, jsxs } from "valyrian.js/jsx-runtime";
export type { JSX } from "valyrian.js/jsx-runtime";
type JsxTag = string | Component | POJOComponent | FragmentSentinel;
type JsxProps = Properties & {
    children?: any;
};
export declare function jsxDEV(type: JsxTag, props: JsxProps, key?: string | number, isStaticChildren?: boolean, source?: unknown, self?: unknown): Vnode;
//# sourceMappingURL=index.d.ts.map