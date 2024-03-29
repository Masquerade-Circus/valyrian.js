import { Store } from "valyrian.js/store";
import expect from "expect";

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
        state.c = { ...state.c, a: payload };
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
      items(state) {
        return state.b;
      }
    }
  };

  return new Store(mainModule);
}

// eslint-disable-next-line max-lines-per-function
describe("Store slim", () => {
  it("Create empty state if state is not passed", () => {
    const store = new Store();
    expect(store.state).toBeDefined();
  });

  it("Use deepFrozen to froze the state", () => {
    const store = new Store({
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
    expect(() => store.state.b.push(1)).toThrowError("Cannot add property 1, object is not extensible");
  });

  it("Throw error if you try to remove a property directly", () => {
    const store = getNewStore();
    expect(() => delete store.state.b).toThrowError("You need to commit a mutation to change the state");
  });

  it("Throw error if you try to remove a deeper property directly", () => {
    const store = getNewStore();
    expect(() => delete store.state.c.a).toThrowError("Cannot delete property 'a' of #<Object>");
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

    const store1 = new Store(myModule);
    const store2 = new Store(myModule);

    store1.commit("increment", 5);
    store2.commit("increment", 3);

    expect(store1.state.count).toEqual(6);
    expect(store2.state.count).toEqual(4);
  });
});
