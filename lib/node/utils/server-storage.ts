import { getRuntimeStorage, isRuntimeContextActive, NodeRuntime } from "../runtime";

export class ServerStorage implements Storage {
  private readonly storeKey = Symbol("server-storage");
  private readonly globalStore: Record<string | symbol, unknown> = {};

  isContextActive(): boolean {
    return isRuntimeContextActive();
  }

  get store(): Record<string | symbol, any> {
    return getRuntimeStorage(this.storeKey) ?? this.globalStore;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    const store = this.store;
    for (const key in store) {
      Reflect.deleteProperty(store, key);
    }
  }

  getItem(key: string): string | null {
    const store = this.store;
    return key in store ? store[key] : null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    Reflect.deleteProperty(this.store, key);
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  /**
   * @deprecated Use `NodeRuntime.run()` instead. This method may be removed in v10.
   */
  static run<T>(callback: () => T): T {
    return NodeRuntime.run(callback);
  }

  static isContextActive(): boolean {
    return isRuntimeContextActive();
  }

  toJSON(): Record<string, string> {
    return { ...this.store };
  }
}
