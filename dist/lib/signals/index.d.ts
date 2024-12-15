export type Signal<T> = [() => T, (newValue: T | ((current: T) => T)) => void, () => void];
export declare function createSignal<T>(initialValue: T): Signal<T>;
export declare function createEffect(effect: Function, dependencies?: any[]): void;
export type SignalStore<T> = [() => T, (path: string, newValue: T | ((current: T) => T) | any) => void];
export declare function createSignalStore<T>(initialState: T): SignalStore<T>;
//# sourceMappingURL=index.d.ts.map