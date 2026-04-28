import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { deepCloneUnfreeze, deepFreeze, get, hasChanged, set } from "valyrian.js/utils";

describe("Utils", () => {
  describe("hasChanged", () => {
    it("should return false for the same object reference", () => {
      const value = { name: "Arya" };

      expect(hasChanged(value, value)).toEqual(false);
    });

    it("should detect arrays with different lengths", () => {
      expect(hasChanged(["Arya"], ["Arya", "Sansa"])).toEqual(true);
    });

    it("should detect arrays with different values", () => {
      expect(hasChanged(["Arya", "Bran"], ["Arya", "Sansa"])).toEqual(true);
    });

    it("should detect objects with missing or extra own keys", () => {
      expect(hasChanged({ name: "Arya" }, { name: "Arya", title: "No One" })).toEqual(true);
      expect(hasChanged({ name: "Arya", title: "No One" }, { name: "Arya" })).toEqual(true);
    });

    it("should compare equivalent cyclic objects without overflowing", () => {
      const prev: { name: string; self?: unknown } = { name: "Arya" };
      const current: { name: string; self?: unknown } = { name: "Arya" };
      prev.self = prev;
      current.self = current;

      expect(hasChanged(prev, current)).toEqual(false);
    });

    it("should detect differences inside cyclic objects", () => {
      const prev: { profile: { name: string }; self?: unknown } = { profile: { name: "Arya" } };
      const current: { profile: { name: string }; self?: unknown } = { profile: { name: "Sansa" } };
      prev.self = prev;
      current.self = current;

      expect(hasChanged(prev, current)).toEqual(true);
    });

    it("should handle different cyclic topologies without overflowing", () => {
      const prev: { name: string; next?: unknown } = { name: "Arya" };
      const current: { name: string; next?: unknown } = { name: "Arya" };
      const currentNext: { name: string; next?: unknown } = { name: "Arya" };
      prev.next = prev;
      current.next = currentNext;
      currentNext.next = current;

      expect(typeof hasChanged(prev, current)).toEqual("boolean");
    });

    it("should compare own enumerable keys without treating prototypes as a special contract", () => {
      class Previous {
        value = 1;
      }
      class Current {
        value = 1;
      }

      expect(hasChanged(new Previous(), new Current())).toEqual(false);
    });

    it("should compare own enumerable keys instead of inherited enumerable keys", () => {
      const inherited: { inherited?: unknown } = {};
      inherited.inherited = inherited;
      const prev = Object.create(inherited);
      const current = Object.create(inherited);
      prev.own = "same";
      current.own = "same";

      expect(hasChanged(prev, current)).toEqual(false);
    });
  });

  describe("get", () => {
    it("should respect falsy default values", () => {
      const value = { profile: { name: "Arya" } };

      expect(get(value, "profile.age", 0)).toEqual(0);
      expect(get(value, "profile.enabled", false)).toEqual(false);
      expect(get(value, "profile.title", "")).toEqual("");
    });

    it("should return null for missing paths when no default value exists", () => {
      expect(get({ profile: { name: "Arya" } }, "profile.age")).toEqual(null);
    });
  });

  describe("set", () => {
    it("should block prototype pollution paths", () => {
      const target: Record<string, unknown> = {};

      set(target, "__proto__.polluted", true);
      set(target, "constructor.prototype.polluted", true);
      set(target, "prototype.polluted", true);

      expect(({} as Record<string, unknown>).polluted).toEqual(undefined);
      expect(target).toEqual({});
    });

    it("should create intermediate objects for nested paths", () => {
      const target: Record<string, any> = {};

      set(target, "profile.house.name", "Stark");

      expect(target).toEqual({ profile: { house: { name: "Stark" } } });
    });
  });

  describe("deepFreeze", () => {
    it("should handle cycles without throwing", () => {
      const value: { name: string; self?: unknown } = { name: "Arya" };
      value.self = value;

      expect(() => deepFreeze(value)).not.toThrow();
      expect(Object.isFrozen(value)).toEqual(true);
    });
  });

  describe("deepCloneUnfreeze", () => {
    it("should preserve cycles", () => {
      const value: { name: string; self?: unknown } = { name: "Arya" };
      value.self = value;
      deepFreeze(value);

      const clone = deepCloneUnfreeze(value);

      expect(clone).not.toBe(value);
      expect(clone.self).toBe(clone);
      expect(Object.isFrozen(clone)).toEqual(false);
    });

    it("should clone Date, Map, and Set values", () => {
      const date = new Date("2024-01-01T00:00:00.000Z");
      const mapValue = { name: "Arya" };
      const setValue = { name: "Sansa" };
      const value = {
        date,
        map: new Map([["profile", mapValue]]),
        set: new Set([setValue])
      };

      const clone = deepCloneUnfreeze(value);

      expect(clone.date).not.toBe(date);
      expect(clone.date.getTime()).toEqual(date.getTime());
      expect(clone.map).not.toBe(value.map);
      expect(clone.map.get("profile")).toEqual(mapValue);
      expect(clone.map.get("profile")).not.toBe(mapValue);
      expect(clone.set).not.toBe(value.set);
      expect([...clone.set][0]).toEqual(setValue);
      expect([...clone.set][0]).not.toBe(setValue);
    });

    it("should not clone class instances unless requested", () => {
      class Profile {
        name = "Arya";
      }
      const profile = new Profile();
      const value = { profile };

      const clone = deepCloneUnfreeze(value);

      expect(clone).not.toBe(value);
      expect(clone.profile).toBe(profile);
    });
  });
});
