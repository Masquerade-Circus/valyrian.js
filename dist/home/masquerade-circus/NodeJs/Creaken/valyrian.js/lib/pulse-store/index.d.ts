type State = Record<string, any>;
export type Pulse<StateType> = (state: StateType, ...args: any[]) => void | Promise<void>;
export type Pulses<StateType> = {
    [key: string]: Pulse<StateType>;
};
type ProxyState<StateType> = StateType & {
    [key: string]: any;
};
type StorePulses<PulsesType> = {
    [K in keyof PulsesType]: PulsesType[K] extends (state: any, ...args: infer Args) => infer R ? (...args: Args) => R : never;
};
export declare function createPulseStore<StateType extends State, PulsesType extends Pulses<StateType>>(initialState: StateType, pulses: PulsesType): () => [ProxyState<StateType>, StorePulses<PulsesType>];
export declare function createMutableStore<StateType extends State, PulsesType extends Pulses<StateType>>(initialState: StateType, pulses: PulsesType): () => [ProxyState<StateType>, StorePulses<PulsesType>];
export declare function createEffect(effect: Function): void;
export {};
//# sourceMappingURL=index.d.ts.map