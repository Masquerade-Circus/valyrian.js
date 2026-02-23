export type NetworkStatus = {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
};
export type NetworkListener = (status: NetworkStatus) => void;
export declare enum NetworkEvent {
    ONLINE = "online",
    OFFLINE = "offline",
    CHANGE = "change"
}
export declare enum SignalLevel {
    None = 0,
    Poor = 1,
    Fair = 2,
    Good = 3,
    Excellent = 4
}
type NetworkConnection = {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    addEventListener?: (event: string, listener: () => void) => void;
    removeEventListener?: (event: string, listener: () => void) => void;
};
type NavigatorLike = {
    onLine: boolean;
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
};
type WindowLike = {
    addEventListener?: (event: string, listener: () => void) => void;
    removeEventListener?: (event: string, listener: () => void) => void;
};
export type NetworkManagerRuntime = {
    isNodeJs?: boolean;
    navigator?: NavigatorLike | null;
    window?: WindowLike | null;
};
export type NetworkManagerOptions = {
    runtime?: NetworkManagerRuntime;
};
export declare class NetworkError extends Error {
}
export declare class NetworkManager {
    #private;
    NetworkEvent: typeof NetworkEvent;
    constructor(options?: NetworkManagerOptions);
    private getConnection;
    getNetworkStatus(): NetworkStatus;
    getSignalLevel(): SignalLevel;
    isConnectionPoor(): boolean;
    getStatus(): NetworkStatus;
    private notifyListeners;
    private getListeners;
    on(event: NetworkEvent, listener: NetworkListener): () => void;
    off(event: NetworkEvent, listener: NetworkListener): void;
    destroy(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map