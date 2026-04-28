import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { Task } from "valyrian.js/tasks";
import { wait } from "./utils/helpers";

describe("Tasks", () => {
  it("should run with takeLatest strategy", async () => {
    const task = new Task(async (args: { id: number; delay: number }, { signal }: any) => {
      await wait(args.delay);
      if (signal.aborted) {
        throw new Error("aborted");
      }
      return args.id;
    });

    const first = task.run({ id: 1, delay: 20 });
    const second = task.run({ id: 2, delay: 0 });

    await second;
    await first;

    expect(task.state.status).toEqual("success");
    expect(task.state.result).toEqual(2);
  });

  it("should drop runs while task is running", async () => {
    let called = 0;
    const task = new Task(
      async (_args: number) => {
        called += 1;
        await wait(15);
        return called;
      },
      { strategy: "drop" }
    );

    const p1 = task.run(1);
    const p2 = task.run(2);

    await p1;
    await p2;

    expect(called).toEqual(1);
  });

  it("should enqueue runs sequentially", async () => {
    const order: number[] = [];
    const task = new Task(
      async (args: number) => {
        order.push(args);
        await wait(5);
        return args;
      },
      { strategy: "enqueue" }
    );

    await Promise.all([task.run(1), task.run(2), task.run(3)]);
    expect(order).toEqual([1, 2, 3]);
    expect(task.state.result).toEqual(3);
  });

  it("should cancel running task", async () => {
    const task = new Task(async (_args: number, { signal }: any) => {
      await wait(20);
      if (signal.aborted) {
        throw new Error("aborted");
      }
      return 1;
    });

    const events: string[] = [];
    task.on("cancel", () => events.push("cancel"));

    const running = task.run(1);
    task.cancel();
    await running;

    expect(task.state.status).toEqual("cancelled");
    expect(events).toEqual(["cancel"]);
  });

  it("should let reset override a prior cancel while the same run is aborting", async () => {
    const task = new Task(async (_args: number, { signal }: any) => {
      await new Promise((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            wait(0).then(() => reject(new Error("aborted")));
          },
          { once: true }
        );
      });

      return 1;
    });

    const events: string[] = [];
    task.on("cancel", () => events.push("cancel"));

    const running = task.run(1);
    task.cancel();
    task.reset();
    await running;

    expect(task.state.status).toEqual("idle");
    expect(task.state.running).toEqual(false);
    expect(events).toEqual([]);
  });

  it("should not cancel after a successful run has finished", async () => {
    const task = new Task(async () => 42);
    const events: string[] = [];
    task.on("cancel", () => events.push("cancel"));

    await task.run();
    task.cancel();

    expect(task.state.status).toEqual("success");
    expect(task.state.running).toEqual(false);
    expect(task.state.result).toEqual(42);
    expect(events).toEqual([]);
  });

  it("should emit cancel after reset before a later run", async () => {
    const task = new Task(async (_args: number, { signal }: any) => {
      await wait(20);
      if (signal.aborted) {
        throw new Error("aborted");
      }
      return 1;
    });

    const events: string[] = [];
    task.on("cancel", () => events.push("cancel"));

    await task.run(1);
    task.reset();

    const running = task.run(2);
    task.cancel();
    await running;

    expect(task.state.status).toEqual("cancelled");
    expect(events).toEqual(["cancel"]);
  });

  it("should not let reset during an active run suppress cancellation from the next run", async () => {
    const task = new Task(async (args: number, { signal }: any) => {
      await wait(20);
      if (signal.aborted) {
        throw new Error("aborted");
      }
      return args;
    });

    const events: string[] = [];
    task.on("cancel", () => events.push("cancel"));

    const first = task.run(1);
    task.reset();
    const second = task.run(2);
    task.cancel();
    await Promise.all([first, second]);

    expect(task.state.status).toEqual("cancelled");
    expect(events).toEqual(["cancel"]);
  });
});
