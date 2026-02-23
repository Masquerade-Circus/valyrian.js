import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { NetworkEvent, NetworkManager, SignalLevel } from "valyrian.js/network";

describe("Network", () => {
  it("should return safe defaults in node runtime", () => {
    const network = new NetworkManager({
      runtime: {
        isNodeJs: true,
        navigator: null,
        window: null
      }
    });

    expect(network.getNetworkStatus()).toEqual({ online: true });
    expect(network.getSignalLevel()).toEqual(SignalLevel.Good);
    expect(network.isConnectionPoor()).toBeFalse();

    network.destroy();
  });

  it("should react to online/offline/change events and infer signal", () => {
    const windowListeners: Record<string, () => void> = {};
    const connectionListeners: Record<string, () => void> = {};

    const connection = {
      effectiveType: "3g",
      downlink: 1,
      rtt: 250,
      saveData: true,
      addEventListener(event: string, listener: () => void) {
        connectionListeners[event] = listener;
      },
      removeEventListener(event: string) {
        delete connectionListeners[event];
      }
    };

    const navigatorMock = {
      onLine: false,
      connection
    };

    const windowMock = {
      addEventListener(event: string, listener: () => void) {
        windowListeners[event] = listener;
      },
      removeEventListener(event: string) {
        delete windowListeners[event];
      }
    };

    const network = new NetworkManager({
      runtime: {
        isNodeJs: false,
        navigator: navigatorMock,
        window: windowMock
      }
    });

    expect(network.getNetworkStatus().online).toEqual(false);
    expect(network.getSignalLevel()).toEqual(SignalLevel.None);

    const seen: string[] = [];
    network.on(NetworkEvent.ONLINE, () => seen.push("online"));
    network.on(NetworkEvent.OFFLINE, () => seen.push("offline"));
    network.on(NetworkEvent.CHANGE, () => seen.push("change"));

    navigatorMock.onLine = true;
    connection.effectiveType = "4g";
    connection.downlink = 6;
    connection.rtt = 70;
    windowListeners.online();

    expect(network.getSignalLevel()).toEqual(SignalLevel.Excellent);
    expect(seen).toContain("online");

    connectionListeners.change();
    expect(seen).toContain("change");

    navigatorMock.onLine = false;
    windowListeners.offline();
    expect(network.isConnectionPoor()).toBeTrue();
    expect(seen).toContain("offline");

    network.destroy();
    expect(windowListeners.online).toBeUndefined();
    expect(windowListeners.offline).toBeUndefined();
    expect(connectionListeners.change).toBeUndefined();
  });
});
