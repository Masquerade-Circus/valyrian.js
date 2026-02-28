type State = Record<string, any>;
export type PulseContext = {
    $flush: () => void;
};
export type Pulse<StateType, TReturn = unknown> = (state: StateType, ...args: any[]) => TReturn | Promise<TReturn>;
type ProxyState<StateType> = StateType & {
    [key: string]: any;
};
type StorePulses<PulsesType> = {
    [K in keyof PulsesType]: PulsesType[K] extends (state: any, ...args: infer Args) => infer R ? (...args: Args) => R : never;
};
export declare function createPulseStore<StateType extends State, PulsesType extends Record<string, Pulse<StateType, any>>>(initialState: StateType, pulses: PulsesType & ThisType<PulsesType & PulseContext>): StorePulses<PulsesType> & {
    state: ProxyState<StateType>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
};
export declare function createMutableStore<StateType extends State, PulsesType extends Record<string, Pulse<StateType, any>>>(initialState: StateType, pulses: PulsesType & ThisType<PulsesType & PulseContext>): StorePulses<PulsesType> & {
    state: ProxyState<StateType>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
};
export declare function createEffect(effect: Function): () => void;
export declare function createPulse<T>(initialValue: T): [() => T, (newValue: T | ((current: T) => T)) => void, () => void];
export {};
//# sourceMappingURL=index.d.ts.map