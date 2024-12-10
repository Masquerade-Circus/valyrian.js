import { expect, describe, test as it, beforeEach } from "bun:test";
import "valyrian.js/node";
import { createNativeStore, StorageType } from "valyrian.js/native-store";

describe("NativeStore Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("should create a store using localStorage with an empty state", () => {
    const store = createNativeStore("testLocal", {}, StorageType.Local);
    expect(store.state).toEqual({});
  });

  it("should create a store using sessionStorage with an empty state", () => {
    const store = createNativeStore("testSession", {}, StorageType.Session);
    expect(store.state).toEqual({});
  });

  it("should reuse an existing store if reuseIfExist is true", () => {
    const store1 = createNativeStore("reuseTest", {}, StorageType.Local);
    store1.set("key", "value");

    const store2 = createNativeStore("reuseTest", {}, StorageType.Local, true);
    expect(store2.get("key")).toEqual("value");
  });

  it("should throw an error if a store with the same key exists and reuseIfExist is false", () => {
    createNativeStore("testDuplicate", {}, StorageType.Local);
    expect(() => createNativeStore("testDuplicate", {}, StorageType.Local, false)).toThrowError();
  });

  it("should store a value in localStorage", () => {
    const store = createNativeStore("testLocalStorage", {}, StorageType.Local);
    store.set("key1", "value1");
    expect(localStorage.getItem("testLocalStorage")).toEqual(JSON.stringify({ key1: "value1" }));
  });

  it("should store a value in sessionStorage", () => {
    const store = createNativeStore("testSessionStorage", {}, StorageType.Session);
    store.set("key1", "value1");
    expect(sessionStorage.getItem("testSessionStorage")).toEqual(JSON.stringify({ key1: "value1" }));
  });

  it("should retrieve a value from localStorage", () => {
    const store = createNativeStore("testRetrieveLocal", {}, StorageType.Local);
    store.set("key", "value");
    const retrieved = store.get("key");
    expect(retrieved).toEqual("value");
  });

  it("should retrieve a value from sessionStorage", () => {
    const store = createNativeStore("testRetrieveSession", {}, StorageType.Session);
    store.set("key", "value");
    const retrieved = store.get("key");
    expect(retrieved).toEqual("value");
  });

  it("should delete a value from localStorage", () => {
    const store = createNativeStore("testDeleteLocal", {}, StorageType.Local);
    store.set("key", "value");
    store.delete("key");
    expect(localStorage.getItem("testDeleteLocal")).toEqual(JSON.stringify({}));
  });

  it("should delete a value from sessionStorage", () => {
    const store = createNativeStore("testDeleteSession", {}, StorageType.Session);
    store.set("key", "value");
    store.delete("key");
    expect(sessionStorage.getItem("testDeleteSession")).toEqual(JSON.stringify({}));
  });

  it("should clear the store in localStorage", () => {
    const store = createNativeStore("testClearLocal", {}, StorageType.Local);
    store.set("key", "value");
    store.clear();
    expect(localStorage.getItem("testClearLocal")).toEqual(null);
  });

  it("should clear the store in sessionStorage", () => {
    const store = createNativeStore("testClearSession", {}, StorageType.Session);
    store.set("key", "value");
    store.clear();
    expect(sessionStorage.getItem("testClearSession")).toEqual(null);
  });
});
