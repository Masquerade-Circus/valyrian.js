import { Vnode, type Component, type Fragment as FragmentSentinel, type POJOComponent, type Properties } from "../index";
type JsxTag = string | Component | POJOComponent | FragmentSentinel;
type JsxProps = Properties & {
    children?: any;
};
type JsxPropsWithChildren = Properties & {
    children: any[];
};
export declare function jsx(tag: JsxTag, props: JsxProps, key?: string | number): Vnode;
export declare function jsxs(tag: JsxTag, props: JsxPropsWithChildren, key?: string | number): Vnode;
export declare const Fragment: FragmentSentinel;
export declare namespace JSX {
    interface IntrinsicElements extends Record<string | number | symbol, any> {
    }
    type Element = Vnode | string | number | null | undefined | boolean | Promise<any>;
    type ComponentReturnType = string | number | null | undefined | boolean | Element | Element[];
}
export {};
//# sourceMappingURL=index.d.ts.map