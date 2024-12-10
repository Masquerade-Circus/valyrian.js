import { FluxStore } from "valyrian.js/flux-store";
import { expect, describe, test as it } from "bun:test";

// eslint-disable-next-line max-lines-per-function
describe("FluxStore", () => {
  function getNewStore() {
    const mainModule = {
      state: { b: [1], a: 0, c: { a: 1 } },
      mutations: {
        pushB(state, payload) {
          state.b = [...state.b, payload];
        },
        deleteB(state) {
          delete state.b;
        },
        increment(state, payload) {
          state.a = state.a + payload;
        },
        changeC(state, payload) {
          state.c = Object.assign({}, state.c, { a: payload });
        },
        changeCDirectly(state, payload) {
          state.c.a = payload;
        }
      },
      actions: {
        pushB(context, payload) {
          return new Promise((resolve) => {
            setTimeout(() => {
              context.commit("pushB", payload);
              resolve();
            }, 10);
          });
        }
      },
      getters: {
        length(state, getters) {
          return getters.items.length;
        },
        items(state, getters) {
          return state.b;
        }
      }
    };

    return new FluxStore(mainModule);
  }

  it("Create empty state if state is not passed", () => {
    const store = new FluxStore();
    expect(store.state).toBeDefined();
  });

  it("Use deepFrozen to froze the state", () => {
    const store = new FluxStore({
      state: {
        a: {
          b: {
            c: {
              d: null
            },
            d: null
          }
        }
      }
    });

    expect(Object.isFrozen(store.state.a.b.c.d)).toBeTruthy();
  });

  it("Throw error if you try to mutate the state directly", () => {
    const store = getNewStore();
    expect(() => (store.state.b = 1)).toThrowError("You need to commit a mutation to change the state");
  });

  it("Throw error if you try to mutate a deeper property of the state directly", () => {
    const store = getNewStore();
    expect(() => store.state.b.push(1)).toThrowError("Attempted to assign to readonly property.");
    expect(() => (store.state.c.a = 2)).toThrowError("Attempted to assign to readonly property.");
    expect(store.state.c.a).toEqual(1);
  });

  it("Throw error if you try to remove a property directly", () => {
    const store = getNewStore();
    expect(() => delete store.state.b).toThrowError("You need to commit a mutation to change the state");
  });

  it("Fail silently if you try to remove a deeper property directly", () => {
    const store = getNewStore();
    expect(() => delete store.state.c.a).toThrowError("Unable to delete property.");
    expect(store.state.c.a).toEqual(1);
  });

  it("Mutate the state by commit", () => {
    const store = getNewStore();
    expect(store.state.a).toEqual(0);
    store.commit("increment", 1);
    expect(store.state.a).toEqual(1);

    expect(store.state.b).toEqual([1]);
    store.commit("deleteB");
    expect(store.state.b).toBeUndefined();
  });

  it("Throw error if you try to commit an undefined mutation", () => {
    const store = getNewStore();
    expect(() => store.commit("hello")).toThrowError('The mutation "hello" does not exists.');
  });

  it("Mutate the state by dispatch", async () => {
    const store = getNewStore();
    expect(store.state.b).toEqual([1]);
    await store.dispatch("pushB", 2);
    expect(store.state.b).toEqual([1, 2]);
  });

  it("Throw error if you try to dispatch an undefined action", () => {
    const store = getNewStore();
    expect(() => store.dispatch("hello")).toThrowError('The action "hello" does not exists.');
  });

  it("Use a getter to obtain a property from the state", () => {
    const store = getNewStore();
    expect(store.getters.items).toEqual([1]);
  });

  it("Use a getter to obtain data using another getter", () => {
    const store = getNewStore();
    expect(store.getters.length).toEqual(1);
  });

  it("Fail silently if you try to get an undefined getter, getter must return undefined", () => {
    const store = getNewStore();
    expect(store.getters.ok).toBeUndefined();
  });

  it("Use plugins", () => {
    const store = new FluxStore();
    const params = [];
    const plugin = (...args) => {
      params.push(args);
    };
    store.use(plugin, "option1", "option2");
    store.use(plugin, "option1", "option2");
    expect(params).toEqual([[expect.any(FluxStore), "option1", "option2"]]);
  });

  it("Add a listener", () => {
    const store = getNewStore();
    let count = 0;
    const method = () => count++;
    expect(count).toEqual(0);
    store.on("set", method);
    store.on("delete", method);
    store.commit("increment", 1);
    store.commit("deleteB");
    expect(count).toEqual(2);
  });

  it("Remove a named listener", () => {
    const store = getNewStore();
    let count = 0;
    const method = () => count++;
    expect(count).toEqual(0);
    store.on("set", method);
    store.commit("increment");
    expect(count).toEqual(1);
    store.off("set", method);
    store.commit("increment");
    expect(count).toEqual(1);
  });

  it("Remove an anonymous method by returned remove callback", () => {
    const store = getNewStore();
    let count = 0;
    expect(count).toEqual(0);
    const removeListener = store.on("set", () => count++);
    store.commit("increment");
    expect(count).toEqual(1);
    removeListener();
    store.commit("increment");
    expect(count).toEqual(1);
  });

  it("Throw error if you try to listen with something other than a function", () => {
    const store = getNewStore();
    expect(() => store.on("set", "hello")).toThrowError("You need to provide a valid function as listener.");
  });

  it("Throw error if you try to remove a listener that is something other than a function", () => {
    const store = getNewStore();
    expect(() => store.off("set", "hello")).toThrowError("You need to provide a valid function as listener.");
  });

  it("Fail silently if you try to remove an already removed or not added listener", () => {
    const store = getNewStore();
    store.off("set", () => {});
  });

  it("Add a listener only once", () => {
    const store = getNewStore();
    let count = 0;
    const method = () => count++;
    expect(count).toEqual(0);
    store.on("set", method);
    store.on("set", method);
    store.on("set", method);
    store.commit("increment");
    expect(count).toEqual(1);
  });

  it("Test all listeners", async () => {
    const store = getNewStore();
    const events = [
      "addlistener",
      "removelistener",
      "set",
      "delete",
      "beforecommit",
      "commit",
      "beforedispatch",
      "dispatch",
      "getter",
      "plugin",
      "registerModule",
      "unregisterModule"
    ];
    const methods = events.reduce((methods, event) => {
      methods[event] = {
        params: [],
        method: (...params) => methods[event].params.push(params)
      };
      return methods;
    }, {});

    events.forEach((event) => store.on(event, methods[event].method));
    store.getters.length;
    await store.dispatch("pushB", 1);
    store.commit("deleteB");
    const plugin = () => {};
    store.use(plugin);
    const module = {};
    store.registerModule("b", module);
    store.unregisterModule("b");
    events.forEach((event) => store.off(event, methods[event].method));

    // Add listener event
    expect(methods.addlistener.params.length).toEqual(events.length);
    expect(methods.addlistener.params).toEqual(
      events.map((event) => {
        return [
          expect.any(FluxStore), // The store
          event, // The listener name
          methods[event].method // The listener added
        ];
      })
    );

    // Remove listener event
    expect(methods.removelistener.params.length).toEqual(1);
    expect(methods.removelistener.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "addlistener", // The listener name
      methods.addlistener.method // The listener added
    ]);

    // Set event also triggered when you register a module
    expect(methods.set.params.length).toEqual(2);
    expect(methods.set.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "b", // The property name
      [1, 1], // The new value,
      [1] // The old value
    ]);

    // Delete event also triggered when you unregister a module
    expect(methods.delete.params.length).toEqual(2);
    expect(methods.delete.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "b", // The property name
      [1, 1] // The old value
    ]);

    // Before commit event
    expect(methods.beforecommit.params.length).toEqual(2);
    expect(methods.beforecommit.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "pushB", // The mutation name
      1 // The params passed to the mutation
    ]);

    // Commit event
    expect(methods.commit.params.length).toEqual(2);
    expect(methods.commit.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "pushB", // The mutation name
      1 // The params passed to the mutation
    ]);

    // Before dispatch event,
    expect(methods.beforedispatch.params.length).toEqual(1);
    expect(methods.beforedispatch.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "pushB", // The action name
      1 // The params passed to the mutation
    ]);

    // Dispatch event
    expect(methods.dispatch.params.length).toEqual(1);
    expect(methods.dispatch.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "pushB", // The action name
      1 // The params passed to the mutation
    ]);

    // Getter event
    expect(methods.getter.params.length).toEqual(2);
    expect(methods.getter.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "items", // The getter name
      [1] // The value of the getter
    ]);

    // Add plugin event
    expect(methods.plugin.params.length).toEqual(1);
    expect(methods.plugin.params[0]).toEqual([
      expect.any(FluxStore), // The store
      plugin // The plugin added
    ]);

    // Register module event
    expect(methods.registerModule.params.length).toEqual(1);
    expect(methods.registerModule.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "b", // The namespace registered
      module, // The module definition
      expect.any(FluxStore) // The store created with the definition
    ]);

    // Unregister module event
    expect(methods.unregisterModule.params.length).toEqual(1);
    expect(methods.unregisterModule.params[0]).toEqual([
      expect.any(FluxStore), // The store
      "b", // The namespace unregistered
      expect.any(FluxStore) // The store created with the definition
    ]);
  });

  it("Register nested modules", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    });

    expect(store.init.modules).toEqual({
      "my.module": expect.any(FluxStore)
    });
    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "world"
        }
      })
    );
  });

  it("Throw an error if you want to overwrite a registered module", () => {
    const store = getNewStore();
    const myModule = {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    };

    store.registerModule("my.module", myModule);

    expect(() => store.registerModule("my.module", myModule)).toThrowError(
      'A module with the namespace "my.module" is already registered.'
    );
  });

  it("Unregister nested modules", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    });

    expect(store.init.modules).toEqual({
      "my.module": expect.any(FluxStore)
    });
    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "world"
        }
      })
    );

    store.unregisterModule("my.module");

    expect(store.init.modules).toEqual({});
    expect(store.state["my.module"]).toBeUndefined();
  });

  it("Fail silently if you try to unregister a nested module twice", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    });

    expect(store.init.modules).toEqual({
      "my.module": expect.any(FluxStore)
    });
    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "world"
        }
      })
    );

    store.unregisterModule("my.module");
    store.unregisterModule("my.module");

    expect(store.init.modules).toEqual({});
    expect(store.state["my.module"]).toBeUndefined();
  });

  it("Call a nested module mutation", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    });

    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "world"
        }
      })
    );

    store.commit("my.module.change");

    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "mundo"
        }
      })
    );
  });

  it("Throw error if try to call a mutation of a non existent module", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    });

    expect(() => store.commit("my.module.not.change")).toThrowError('The module "my.module.not" does not exists.');
  });

  it("Throw error if mutation of a nested module does not exists", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    });

    expect(() => store.commit("my.module.not-change")).toThrowError('The mutation "not-change" does not exists.');
  });

  it("Call a nested module action", async () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      actions: {
        change(store) {
          store.commit("change");
        }
      }
    });

    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "world"
        }
      })
    );

    await store.dispatch("my.module.change");

    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "mundo"
        }
      })
    );
  });

  it("Call a root action and mutation from a nested module action", async () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      actions: {
        async change(store, payload) {
          store.rootStore.commit("increment", payload);
          await store.rootStore.dispatch("pushB", payload);
        }
      }
    });

    expect(store.state).toEqual(
      expect.objectContaining({
        a: 0,
        b: [1]
      })
    );

    await store.dispatch("my.module.change", 5);

    expect(store.state).toEqual(
      expect.objectContaining({
        a: 5,
        b: [1, 5]
      })
    );
  });

  it("Throw error if try to call a action of a non existent module", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      actions: {
        change(store) {
          store.commit("change");
        }
      }
    });

    expect(() => store.dispatch("my.module.not.change")).toThrowError('The module "my.module.not" does not exists.');
  });

  it("Throw error if action of a nested module does not exists", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      actions: {
        change(store) {
          store.commit("change");
        }
      }
    });

    expect(() => store.dispatch("my.module.not-change")).toThrowError('The action "not-change" does not exists.');
  });

  it("Use a getter to obtain a property from the nested module state", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      getters: {
        entity(state, getters) {
          return state.hello;
        },
        capitalizedEntity(state, getters) {
          return getters.entity.charAt(0).toUpperCase() + getters.entity.slice(1);
        }
      }
    });
    expect(store.getters["my.module.entity"]).toEqual("world");
  });

  it("Use a nested module getter to obtain data using another nested getter", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      getters: {
        entity(state, getters) {
          return state.hello;
        },
        capitalizedEntity(state, getters) {
          return getters.entity.charAt(0).toUpperCase() + getters.entity.slice(1);
        }
      }
    });
    expect(store.getters["my.module.capitalizedEntity"]).toEqual("World");
  });

  it("Fail silently if you try to get an undefined nested module getter, getter must return undefined", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      getters: {
        entity(state, getters) {
          return state.hello;
        },
        capitalizedEntity(state, getters) {
          return getters.entity.charAt(0).toUpperCase() + getters.entity.slice(1);
        }
      }
    });
    expect(store.getters["my.module.capitalized"]).toBeUndefined();
  });

  it("Fail silently if you try to get a getter of a non existent nested module", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      getters: {
        entity(state, getters) {
          return state.hello;
        },
        capitalizedEntity(state, getters) {
          return getters.entity.charAt(0).toUpperCase() + getters.entity.slice(1);
        }
      }
    });
    expect(store.getters["my.capitalized"]).toBeUndefined();
    expect(store.getters["other.capitalized"]).toBeUndefined();
  });

  it("Use a getter to obtain a property from the root state and root getters", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      getters: {
        length(state, getters, rootState, rootGetters) {
          return rootGetters.items.length;
        },
        items(state, getters, rootState, rootGetters) {
          return rootState.b;
        }
      }
    });
    expect(store.getters["my.module.length"]).toEqual(1);
    expect(store.getters["my.module.items"]).toEqual([1]);
  });

  it("Register nested modules with initial modules property", () => {
    const store = new FluxStore({
      modules: {
        "my.module": {
          state: { hello: "world" },
          mutations: {
            change(state) {
              state.hello = "mundo";
            }
          }
        }
      }
    });

    expect(store.init.modules).toEqual({
      "my.module": expect.any(FluxStore)
    });
    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "world"
        }
      })
    );
  });

  it("Register nested modules with initial modules property and with child nested modules", () => {
    const moduleA = {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    };

    const moduleB = {
      state: { hola: "mundo" },
      mutations: {
        change(state) {
          state.hola = "world";
        }
      },
      modules: {
        a: moduleA
      }
    };

    const store = new FluxStore({
      modules: {
        b: moduleB
      }
    });

    expect(store.init.modules).toEqual({
      b: expect.any(FluxStore),
      "b.a": expect.any(FluxStore)
    });
    expect(store.state).toEqual(
      expect.objectContaining({
        b: {
          hola: "mundo"
        },
        "b.a": {
          hello: "world"
        }
      })
    );
  });

  it("Trigger listener updating a nested module store", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        },
        deleteHello(state) {
          delete state.hello;
        }
      }
    });
    let count = 0;
    const method = () => count++;
    expect(count).toEqual(0);
    store.on("set", method);
    store.on("delete", method);
    store.commit("my.module.change");
    store.commit("my.module.deleteHello");
    expect(count).toEqual(2);
  });

  it("Trigger listeners within a child nested module", () => {
    const moduleA = {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      }
    };

    const moduleB = {
      state: { hola: "mundo" },
      mutations: {
        change(state) {
          state.hola = "world";
        }
      },
      modules: {
        a: moduleA
      }
    };

    const store = new FluxStore({
      modules: {
        "my.module": moduleB
      }
    });

    let count = 0;
    const method = () => count++;
    expect(count).toEqual(0);
    store.on("set", method);
    store.commit("my.module.change");
    store.commit("my.module.a.change");
    expect(count).toEqual(2);
  });

  it("Declare state as factory function", () => {
    const myModule = {
      state() {
        return {
          count: 1
        };
      },
      mutations: {
        increment(state, payload) {
          state.count = state.count + payload;
        }
      }
    };

    const store1 = new FluxStore(myModule);
    const store2 = new FluxStore(myModule);

    store1.commit("increment", 5);
    store2.commit("increment", 3);

    expect(store1.state.count).toEqual(6);
    expect(store2.state.count).toEqual(4);
  });

  it("Register nested modules with child nested module property", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      modules: {
        child: {
          state: {
            count: 1
          }
        }
      }
    });

    expect(store.init.modules).toEqual({
      "my.module": expect.any(FluxStore),
      "my.module.child": expect.any(FluxStore)
    });
    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "world"
        },
        "my.module.child": {
          count: 1
        }
      })
    );
  });

  it("Unregister nested modules with child nested module", () => {
    const store = getNewStore();
    store.registerModule("my.module", {
      state: { hello: "world" },
      mutations: {
        change(state) {
          state.hello = "mundo";
        }
      },
      modules: {
        child: {
          state: {
            count: 1
          }
        }
      }
    });

    expect(store.init.modules).toEqual({
      "my.module": expect.any(FluxStore),
      "my.module.child": expect.any(FluxStore)
    });
    expect(store.state).toEqual(
      expect.objectContaining({
        "my.module": {
          hello: "world"
        },
        "my.module.child": {
          count: 1
        }
      })
    );

    store.unregisterModule("my.module");

    expect(store.init.modules).toEqual({});
    expect(store.state["my.module"]).toBeUndefined();
    expect(store.state["my.module.child"]).toBeUndefined();
  });

  it("Reflects changes in deeply nested properties via getters", () => {
    const store = new FluxStore({
      state: { deep: { nested: { value: 1 } } },
      mutations: {
        updateNested(state, payload) {
          state.deep.nested.value = payload;
        }
      },
      getters: {
        nestedValue(state) {
          return state.deep.nested.value;
        }
      }
    });

    expect(store.getters.nestedValue).toEqual(1);
    store.commit("updateNested", 10);
    expect(store.getters.nestedValue).toEqual(10);
  });

  it("Restores state to initial values", () => {
    const initialState = () => ({ count: 0 });
    const store = new FluxStore({
      state: initialState,
      mutations: {
        increment(state) {
          state.count++;
        },
        reset(state) {
          Object.assign(state, initialState());
        }
      }
    });

    store.commit("increment");
    expect(store.state.count).toEqual(1);
    store.commit("reset");
    expect(store.state.count).toEqual(0);
  });

  it("Throws error if trying to mutate state directly inside an action", async () => {
    const store = new FluxStore({
      state: { value: 1 },
      actions: {
        async failAction({ state }) {
          state.value = 2; // should throw error
        }
      }
    });

    await expect(store.dispatch("failAction")).rejects.toThrowError(
      "You need to commit a mutation to change the state"
    );
  });

  it("Mutate state inside a module with namespace", () => {
    const store = new FluxStore({
      modules: {
        myModule: {
          state: { counter: 0 },
          mutations: {
            increment(state) {
              state.counter++;
            }
          }
        }
      }
    });

    store.commit("myModule.increment");
    expect(store.state.myModule.counter).toEqual(1);
  });

  it("Dispatch chained actions in correct order", async () => {
    const store = new FluxStore({
      state: { step: 0 },
      actions: {
        async firstAction(context) {
          context.commit("setStep", 1);
          await context.dispatch("secondAction");
        },
        async secondAction(context) {
          context.commit("setStep", 2);
        }
      },
      mutations: {
        setStep(state, step) {
          state.step = step;
        }
      }
    });

    await store.dispatch("firstAction");
    expect(store.state.step).toEqual(2);
  });

  it("Trigger listeners only for specific module events", () => {
    const store = new FluxStore({
      modules: {
        myModule: {
          state: { count: 0 },
          mutations: {
            increment(state) {
              state.count++;
            }
          }
        }
      }
    });

    let moduleCount = 0;
    let globalCount = 0;

    store.on("set", () => globalCount++);
    store.on("set", () => moduleCount++, { namespace: "myModule" });

    store.commit("myModule.increment");

    expect(moduleCount).toEqual(1); // Only triggered for myModule
    expect(globalCount).toEqual(1); // Global listener still works
  });

  it("Handle errors in nested module mutations", () => {
    const store = new FluxStore({
      modules: {
        myModule: {
          state: { value: 0 },
          mutations: {
            faultyMutation() {
              throw new Error("Mutation failed!");
            }
          }
        }
      }
    });

    expect(() => store.commit("myModule.faultyMutation")).toThrowError("Mutation failed!");
    expect(store.state.myModule.value).toEqual(0); // State remains unchanged
  });

  it("Performance test under heavy load", async () => {
    const iterations = 100000;
    const store = new FluxStore({
      state: { counter: 0 },
      mutations: {
        increment(state) {
          state.counter++;
        }
      }
    });

    // eslint-disable-next-line no-console
    console.time("Performance test");
    for (let i = 0; i < iterations; i++) {
      store.commit("increment");
    }
    // eslint-disable-next-line no-console
    console.timeEnd("Performance test");
    expect(store.state.counter).toEqual(iterations);
  });

  it("Performance test under heavy load with deeply array and listeners", async () => {
    const iterations = 10000;
    const store = new FluxStore({
      state: { counter: 0, items: [] },
      mutations: {
        increment(state) {
          state.counter++;
        },
        pushItem(state, payload) {
          state.items.push(payload);
        }
      }
    });

    let listenerCallCount = 0;
    const listener = () => {
      listenerCallCount++;
    };
    store.on("commit", listener);

    // eslint-disable-next-line no-console
    console.time("Performance test");
    for (let i = 0; i < iterations; i++) {
      store.commit("increment");
      store.commit("pushItem", i);
    }
    // eslint-disable-next-line no-console
    console.timeEnd("Performance test");
    expect(store.state.counter).toEqual(iterations);
    expect(store.state.items.length).toEqual(iterations);
    expect(listenerCallCount).toEqual(iterations * 2);
  });
});
