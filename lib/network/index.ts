import { isNodeJs } from "valyrian.js";
import { isFiniteNumber, isFunction, isString } from "valyrian.js/utils";

export type NetworkStatus = {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

export type NetworkListener = (status: NetworkStatus) => void;

export enum NetworkEvent {
  ONLINE = "online",
  OFFLINE = "offline",
  CHANGE = "change"
}

export enum SignalLevel {
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

export class NetworkError extends Error {}

export class NetworkManager {
  #onlineListeners = new Set<NetworkListener>();
  #offlineListeners = new Set<NetworkListener>();
  #changeListeners = new Set<NetworkListener>();

  #isNodeRuntime: boolean;
  #navigator: NavigatorLike | null;
  #window: WindowLike | null;

  #onlineHandler = () => this.notifyListeners(NetworkEvent.ONLINE);
  #offlineHandler = () => this.notifyListeners(NetworkEvent.OFFLINE);
  #changeHandler = () => this.notifyListeners(NetworkEvent.CHANGE);

  NetworkEvent = NetworkEvent;

  constructor(options: NetworkManagerOptions = {}) {
    const runtime = options.runtime || {};

    this.#isNodeRuntime = runtime.isNodeJs ?? isNodeJs;
    this.#navigator = runtime.navigator ?? ((globalThis.navigator as NavigatorLike | undefined) || null);
    this.#window = runtime.window ?? ((globalThis.window as WindowLike | undefined) || null);

    if (this.#isNodeRuntime || !this.#window || !this.#navigator) {
      return;
    }

    if (isFunction(this.#window.addEventListener)) {
      this.#window.addEventListener(NetworkEvent.ONLINE, this.#onlineHandler);
      this.#window.addEventListener(NetworkEvent.OFFLINE, this.#offlineHandler);
    }

    try {
      const connection = this.getConnection();
      if (isFunction(connection.addEventListener)) {
        connection.addEventListener(NetworkEvent.CHANGE, this.#changeHandler);
      }
    } catch {
      // Network Information API not available
    }
  }

  private getConnection(): NetworkConnection {
    if (!this.#navigator) {
      throw new NetworkError("Navigator not available");
    }

    const connection = this.#navigator.connection || this.#navigator.mozConnection || this.#navigator.webkitConnection;

    if (!connection) {
      throw new NetworkError("Connection not available");
    }

    return connection;
  }

  getNetworkStatus(): NetworkStatus {
    if (this.#isNodeRuntime || !this.#navigator) {
      return { online: true };
    }

    const online = this.#navigator.onLine;

    try {
      const connection = this.getConnection();
      return {
        online,
        effectiveType: isString(connection.effectiveType) ? connection.effectiveType : undefined,
        downlink: isFiniteNumber(connection.downlink) ? connection.downlink : undefined,
        rtt: isFiniteNumber(connection.rtt) ? connection.rtt : undefined,
        saveData: connection.saveData === true
      };
    } catch {
      return { online };
    }
  }

  getSignalLevel(): SignalLevel {
    const status = this.getNetworkStatus();

    if (!status.online) {
      return SignalLevel.None;
    }

    if (status.effectiveType === "slow-2g") {
      return SignalLevel.None;
    }

    if (!status.effectiveType) {
      return SignalLevel.Good;
    }

    if (status.effectiveType === "4g") {
      if (
        isFiniteNumber(status.downlink) &&
        status.downlink > 5 &&
        isFiniteNumber(status.rtt) &&
        status.rtt < 100
      ) {
        return SignalLevel.Excellent;
      }
      if (isFiniteNumber(status.downlink) && status.downlink >= 2) {
        return SignalLevel.Good;
      }
      return SignalLevel.Fair;
    }

    if (status.effectiveType === "3g") {
      if (isFiniteNumber(status.downlink) && status.downlink >= 1) {
        return SignalLevel.Fair;
      }
      return SignalLevel.Poor;
    }

    return SignalLevel.Poor;
  }

  isConnectionPoor() {
    return this.getSignalLevel() === SignalLevel.None;
  }

  getStatus() {
    return this.getNetworkStatus();
  }

  private notifyListeners(event: NetworkEvent) {
    const status = this.getNetworkStatus();
    const listeners = this.getListeners(event);
    for (const listener of listeners) {
      listener(status);
    }
  }

  private getListeners(event: NetworkEvent) {
    switch (event) {
      case NetworkEvent.ONLINE:
        return this.#onlineListeners;
      case NetworkEvent.OFFLINE:
        return this.#offlineListeners;
      case NetworkEvent.CHANGE:
        return this.#changeListeners;
      default:
        throw new NetworkError("Invalid event type");
    }
  }

  on(event: NetworkEvent, listener: NetworkListener) {
    this.getListeners(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event: NetworkEvent, listener: NetworkListener) {
    this.getListeners(event).delete(listener);
  }

  destroy() {
    if (!this.#isNodeRuntime) {
      if (this.#window && isFunction(this.#window.removeEventListener)) {
        this.#window.removeEventListener(NetworkEvent.ONLINE, this.#onlineHandler);
        this.#window.removeEventListener(NetworkEvent.OFFLINE, this.#offlineHandler);
      }

      try {
        const connection = this.getConnection();
        if (isFunction(connection.removeEventListener)) {
          connection.removeEventListener(NetworkEvent.CHANGE, this.#changeHandler);
        }
      } catch {
        // Network Information API not available
      }
    }

    this.#onlineListeners.clear();
    this.#offlineListeners.clear();
    this.#changeListeners.clear();
  }
}
