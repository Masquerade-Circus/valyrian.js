type State = Record<string, any>;
export type Pulse<StateType, TReturn = unknown> = (state: StateType, ...args: any[]) => TReturn | Promise<TReturn>;
export type Pulses<StateType> = Record<string, Pulse<StateType, any>>;
type ProxyState<StateType> = StateType & {
    [key: string]: any;
};
type StorePulses<PulsesType extends Pulses<any>> = {
    [K in keyof PulsesType]: PulsesType[K] extends (state: any, ...args: infer Args) => infer R ? (...args: Args) => R : never;
};
export declare function createPulseStore<StateType extends State, PulsesType extends Pulses<StateType>>(initialState: StateType, pulses: PulsesType): StorePulses<PulsesType> & {
    state: ProxyState<StateType>;
};
export declare function createMutableStore<StateType extends State, PulsesType extends Pulses<StateType>>(initialState: StateType, pulses: PulsesType): StorePulses<PulsesType> & {
    state: ProxyState<StateType>;
};
export declare function createEffect(effect: Function): void;
export {};
//# sourceMappingURL=index.d.ts.map