type getter = () => any;
type setter = (newValue: any) => void;
type unsubscribe = () => void;
type subscribe = (callback: () => void) => unsubscribe;
type subscriptions = Set<() => void>;
type signal = [getter, setter, subscribe, subscriptions];
export declare function Signal<T>(initialValue: T): signal;
export {};
//# sourceMappingURL=index.d.ts.map