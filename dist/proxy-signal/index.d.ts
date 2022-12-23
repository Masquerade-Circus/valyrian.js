interface Cleanup {
    (): void;
}
interface Subscription {
    (value: ProxySignal["value"]): void | Cleanup;
}
interface Getter {
    (value: ProxySignal["value"]): any;
}
interface ProxySignal {
    (): ProxySignal["value"];
    (value: Subscription): ProxySignal;
    (path: string, handler: (valueAtPathPosition: any) => any): ProxySignal["value"];
    (path: string, value: any): ProxySignal["value"];
    (value: any): ProxySignal["value"];
    value: any;
    cleanup: () => void;
    getter: (name: string, handler: Getter) => any;
    [key: string | number | symbol]: any;
}
export declare function ProxySignal(value: any): ProxySignal;
export {};
//# sourceMappingURL=index.d.ts.map