export type TaskStatus = "idle" | "running" | "success" | "error" | "cancelled";
export type TaskStrategy = "takeLatest" | "enqueue" | "drop" | "restartable";

export type TaskState<TResult> = {
  status: TaskStatus;
  running: boolean;
  result: TResult | null;
  error: unknown;
};

export type TaskContext = {
  signal: AbortSignal;
};

export type TaskOptions<TArgs, TResult> = {
  strategy?: TaskStrategy;
  onSuccess?: (result: TResult, args: TArgs) => void;
  onError?: (error: unknown, args: TArgs) => void;
};

export type TaskHandler<TArgs, TResult> = (args: TArgs, ctx: TaskContext) => Promise<TResult> | TResult;

type TaskEventMap<TArgs, TResult> = {
  state: Readonly<TaskState<TResult>>;
  success: TResult;
  error: unknown;
  cancel: TArgs;
};

type TaskListeners<TArgs, TResult> = {
  [K in keyof TaskEventMap<TArgs, TResult>]: Set<(payload: TaskEventMap<TArgs, TResult>[K]) => void>;
};

function cloneState<TResult>(state: TaskState<TResult>): Readonly<TaskState<TResult>> {
  return Object.freeze({ ...state });
}

export class Task<TArgs = void, TResult = unknown> {
  #handler: TaskHandler<TArgs, TResult>;
  #options: TaskOptions<TArgs, TResult>;
  #strategy: TaskStrategy;

  #state: TaskState<TResult> = {
    status: "idle",
    running: false,
    result: null,
    error: null
  };

  #activeAbortController: AbortController | null = null;
  #activeExecutionId = 0;
  #queue: Promise<TResult | null> = Promise.resolve(null);

  #listeners: TaskListeners<TArgs, TResult> = {
    state: new Set(),
    success: new Set(),
    error: new Set(),
    cancel: new Set()
  };

  constructor(handler: TaskHandler<TArgs, TResult>, options: TaskOptions<TArgs, TResult> = {}) {
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

  on<K extends keyof TaskEventMap<TArgs, TResult>>(
    event: K,
    callback: (payload: TaskEventMap<TArgs, TResult>[K]) => void
  ) {
    this.#listeners[event].add(callback);
    return () => this.off(event, callback);
  }

  off<K extends keyof TaskEventMap<TArgs, TResult>>(
    event: K,
    callback: (payload: TaskEventMap<TArgs, TResult>[K]) => void
  ) {
    this.#listeners[event].delete(callback);
  }

  #emit<K extends keyof TaskEventMap<TArgs, TResult>>(event: K, payload: TaskEventMap<TArgs, TResult>[K]) {
    for (const listener of this.#listeners[event]) {
      listener(payload);
    }
  }

  #setState(next: Partial<TaskState<TResult>>) {
    Object.assign(this.#state, next);
    this.#emit("state", cloneState(this.#state));
  }

  async #runWithArgs(args: TArgs): Promise<TResult | null> {
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
        if (executionId === this.#activeExecutionId) {
          this.#setState({ status: "cancelled", running: false });
          this.#emit("cancel", args);
        }
        return this.#state.result;
      }

      this.#setState({ status: "error", running: false, error });
      this.#options.onError?.(error, args);
      this.#emit("error", error);
      throw error;
    }
  }

  run(args: TArgs): Promise<TResult | null> {
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

    this.#activeAbortController.abort();
    this.#setState({ status: "cancelled", running: false });
  }

  reset() {
    this.cancel();
    this.#setState({
      status: "idle",
      running: false,
      error: null,
      result: null
    });
  }
}
