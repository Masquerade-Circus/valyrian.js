"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/tasks/index.ts
var index_exports = {};
__export(index_exports, {
  Task: () => Task
});
module.exports = __toCommonJS(index_exports);
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
  #abortCause = null;
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
  async #runWithArgs(args) {
    this.#activeExecutionId += 1;
    const executionId = this.#activeExecutionId;
    if (this.#strategy === "takeLatest" || this.#strategy === "restartable") {
      this.#activeAbortController?.abort();
    }
    this.#activeAbortController = new AbortController();
    const { signal } = this.#activeAbortController;
    this.#setState({ status: "running", running: true, error: null });
    try {
      const result = await this.#handler(args, { signal });
      if (signal.aborted) {
        if (executionId === this.#activeExecutionId && this.#abortCause !== "reset") {
          this.#setState({ status: "cancelled", running: false });
          this.#emit("cancel", args);
        }
        this.#abortCause = null;
        return this.#state.result;
      }
      if (this.#strategy === "takeLatest" && executionId !== this.#activeExecutionId) {
        return this.#state.result;
      }
      this.#setState({ status: "success", running: false, result });
      this.#options.onSuccess?.(result, args);
      this.#emit("success", result);
      this.#abortCause = null;
      return result;
    } catch (error) {
      if (signal.aborted) {
        if (executionId === this.#activeExecutionId && this.#abortCause !== "reset") {
          this.#setState({ status: "cancelled", running: false });
          this.#emit("cancel", args);
        }
        this.#abortCause = null;
        return this.#state.result;
      }
      this.#setState({ status: "error", running: false, error });
      this.#options.onError?.(error, args);
      this.#emit("error", error);
      this.#abortCause = null;
      throw error;
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
    if (!this.#abortCause) {
      this.#abortCause = "cancel";
    }
    this.#activeAbortController.abort();
    this.#setState({ status: "cancelled", running: false });
  }
  reset() {
    this.cancel();
    this.#abortCause = "reset";
    this.#setState({
      status: "idle",
      running: false,
      error: null,
      result: null
    });
  }
};
