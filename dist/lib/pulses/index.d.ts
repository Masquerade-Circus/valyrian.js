type State = Record<string, any>;
export type PulseContext = {
    $flush: () => Promise<void>;
};
export type Pulse<StateType, TReturn = unknown> = (this: PulseContext, state: StateType, ...args: any[]) => TReturn | Promise<TReturn>;
export type Pulses<StateType> = Record<string, Pulse<StateType, any>>;
type ProxyState<StateType> = StateType & {
    [key: string]: any;
};
type StorePulses<PulsesType extends Pulses<any>> = {
    [K in keyof PulsesType]: PulsesType[K] extends (this: any, state: any, ...args: infer Args) => infer R ? (...args: Args) => R : never;
};
export declare function createPulseStore<StateType extends State, PulsesType extends Pulses<StateType>>(initialState: StateType, pulses: PulsesType): StorePulses<PulsesType> & {
    state: ProxyState<StateType>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
};
export declare function createMutableStore<StateType extends State, PulsesType extends Pulses<StateType>>(initialState: StateType, pulses: PulsesType): StorePulses<PulsesType> & {
    state: ProxyState<StateType>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
};
export declare function createEffect(effect: Function): void;
export declare function createPulse<T>(initialValue: T): [() => T, (newValue: T | ((current: T) => T)) => void, () => void];
export {};
//# sourceMappingURL=index.d.ts.map