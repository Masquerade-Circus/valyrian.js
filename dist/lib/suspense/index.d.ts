import { ValyrianComponent, Vnode, Children } from "valyrian.js";
type SuspenseKey = string | number;
type SuspenseProps = {
    suspenseKey: SuspenseKey;
    fallback: any | Vnode | ValyrianComponent;
    error?: (e: Error) => any | Vnode | ValyrianComponent;
    children?: any;
    key?: string | number;
};
export declare function Suspense({ suspenseKey, fallback, error }: SuspenseProps, children: Children): Vnode;
export {};
//# sourceMappingURL=index.d.ts.map