import { Valyrian } from "../index";
export declare type Hook = any;
export interface HookDefinition {
    onCreate: (...args: any[]) => any;
    onUpdate?: (hook: Hook, ...args: any[]) => any;
    onCleanup?: (hook: Hook) => any;
    onRemove?: (hook: Hook) => any;
    returnValue?: (hook: Hook) => any;
}
export interface CreateHook {
    (HookDefinition: HookDefinition): (...args: any[]) => any;
}
export declare const createHook: CreateHook;
export declare const useState: (...args: any[]) => any;
export declare const useEffect: (...args: any[]) => any;
export declare const useRef: (...args: any[]) => any;
export declare const useCallback: (...args: any[]) => any;
export declare const useMemo: (...args: any[]) => any;
declare function plugin(v: Valyrian): void;
export default plugin;
//# sourceMappingURL=index.d.ts.map