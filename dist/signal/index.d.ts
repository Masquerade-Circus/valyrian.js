interface GetterInterface {
    (): any;
}
interface SetterInterface {
    (value: any): void;
}
interface SubscribeInterface {
    (callback: Function): void;
}
interface SubscriptionsInterface extends Array<Function> {
}
export interface SignalInterface extends Array<any> {
    0: GetterInterface;
    1: SetterInterface;
    2: SubscribeInterface;
    3: SubscriptionsInterface;
}
export declare function Signal(initialValue: any): SignalInterface;
export {};
//# sourceMappingURL=index.d.ts.map