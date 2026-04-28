// lib/tasks/index.ts
function cloneState(state) {
  return Object.freeze({ ...state });
}
var Task = class {
  #handler;
  #options;
  #strategy;
  #state = {
    status: "idle",
    running: false,
    result: null,
    error: null
  };
  #activeAbortController = null;
  #activeExecutionId = 0;
  #queue = Promise.resolve(null);
  #abortCauses = /* @__PURE__ */ new WeakMap();
  #listeners = {
    state: /* @__PURE__ */ new Set(),
    success: /* @__PURE__ */ new Set(),
    error: /* @__PURE__ */ new Set(),
    cancel: /* @__PURE__ */ new Set()
  };
  constructor(handler, options = {}) {
    this.#handler = handler;
    this.#options = options;
    this.#strategy = options.strategy || "takeLatest";
  }
  get state() {
    return cloneState(this.#state);
  }
  data() {
    return this.#state.result;
  }
  error() {
    return this.#state.error;
  }
  on(event, callback) {
    this.#listeners[event].add(callback);
    return () => this.off(event, callback);
  }
  off(event, callback) {
    this.#listeners[event].delete(callback);
  }
  #emit(event, payload) {
    for (const listener of this.#listeners[event]) {
      listener(payload);
    }
  }
  #setState(next) {
    Object.assign(this.#state, next);
    this.#emit("state", cloneState(this.#state));
  }
  #setAbortCause(abortController, cause) {
    if (cause === "reset" || !this.#abortCauses.has(abortController)) {
      this.#abortCauses.set(abortController, cause);
    }
  }
  async #runWithArgs(args) {
    this.#activeExecutionId += 1;
    const executionId = this.#activeExecutionId;
    if (this.#strategy === "takeLatest" || this.#strategy === "restartable") {
      this.#activeAbortController?.abort();
    }
    const abortController = new AbortController();
    this.#activeAbortController = abortController;
    const { signal } = abortController;
    this.#setState({ status: "running", running: true, error: null });
    try {
      const result = await this.#handler(args, { signal });
      if (signal.aborted) {
        if (executionId === this.#activeExecutionId && this.#abortCauses.get(abortController) !== "reset") {
          this.#setState({ status: "cancelled", running: false });
          this.#emit("cancel", args);
        }
        return this.#state.result;
      }
      if (this.#strategy === "takeLatest" && executionId !== this.#activeExecutionId) {
        return this.#state.result;
      }
      this.#setState({ status: "success", running: false, result });
      this.#options.onSuccess?.(result, args);
      this.#emit("success", result);
      return result;
    } catch (error) {
      if (signal.aborted) {
        if (executionId === this.#activeExecutionId && this.#abortCauses.get(abortController) !== "reset") {
          this.#setState({ status: "cancelled", running: false });
          this.#emit("cancel", args);
        }
        return this.#state.result;
      }
      this.#setState({ status: "error", running: false, error });
      this.#options.onError?.(error, args);
      this.#emit("error", error);
      throw error;
    } finally {
      if (executionId === this.#activeExecutionId && this.#activeAbortController === abortController) {
        this.#activeAbortController = null;
      }
    }
  }
  run(args) {
    if (this.#strategy === "drop" && this.#state.running) {
      return Promise.resolve(this.#state.result);
    }
    if (this.#strategy === "enqueue") {
      this.#queue = this.#queue.catch(() => null).then(() => this.#runWithArgs(args));
      return this.#queue;
    }
    return this.#runWithArgs(args);
  }
  cancel() {
    if (!this.#activeAbortController) {
      return;
    }
    const abortController = this.#activeAbortController;
    this.#setAbortCause(abortController, "cancel");
    abortController.abort();
    this.#setState({ status: "cancelled", running: false });
  }
  reset() {
    if (this.#activeAbortController) {
      this.#setAbortCause(this.#activeAbortController, "reset");
      this.#activeAbortController.abort();
    }
    this.#setState({
      status: "idle",
      running: false,
      error: null,
      result: null
    });
  }
};
export {
  Task
};
