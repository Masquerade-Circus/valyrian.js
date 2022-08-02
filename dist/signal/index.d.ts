interface Cleanup {
    (): void;
}
interface Subscription {
    (value: Signal["value"]): void | Cleanup;
}
interface Getter {
    (value: Signal["value"]): any;
}
interface Signal {
    (): Signal["value"];
    (value: Subscription): Signal;
    (path: string, handler: (valueAtPathPosition: any) => any): Signal["value"];
    (path: string, value: any): Signal["value"];
    (value: any): Signal["value"];
    value: any;
    cleanup: () => void;
    getter: (name: string, handler: Getter) => any;
    [key: string | number | symbol]: any;
}
export declare function Signal(value: any): Signal;
export {};
//# sourceMappingURL=index.d.ts.map