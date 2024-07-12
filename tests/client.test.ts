declare global {
  var __REDIS__: {
    host: string;
    port: number;
    db: number;
  };
}

import { Client, Task } from "../src";
import {
  DEFAULT_DEADLINE,
  DEFAULT_MAX_RETRY,
  DEFAULT_PROCESS_AT,
  DEFAULT_QUEUE,
  DEFAULT_TIMEOUT,
  NO_TIMEOUT,
  Options,
} from "../src/options";
import { TaskInfo, TaskState } from "../src/task-info";

describe("Client Enqueue", () => {
  const client = new Client({ ...global.__REDIS__ });
  const task = new Task("send_email", {
    to: "customer@gmail.com",
    from: "merchant@example.com",
  });

  afterEach(() => client["broker"]["redis"].flushdb());
  afterAll(() => client["broker"]["redis"].quit());

  test("Process task immediately", async () => {
    const want: Partial<TaskInfo> = {
      queue: DEFAULT_QUEUE,
      type: task.typeName,
      payload: task.payload,
      state: TaskState.TaskStatePending,
      maxRetry: DEFAULT_MAX_RETRY,
      retried: 0,
      lastErr: "",
      lastFailedAt: 0,
      timeout: DEFAULT_TIMEOUT,
      deadline: DEFAULT_DEADLINE,
      nextProcessAt: DEFAULT_PROCESS_AT,
    };
    const got = await client.enqueue(task);

    expect(got).toMatchObject(want);
  });

  test("Process task immediately with a custom retry count", async () => {
    const opts: Partial<Options> = { retry: 3 };
    const want: Partial<TaskInfo> = {
      queue: DEFAULT_QUEUE,
      type: task.typeName,
      payload: task.payload,
      state: TaskState.TaskStatePending,
      maxRetry: 3,
      retried: 0,
      lastErr: "",
      lastFailedAt: 0,
      timeout: DEFAULT_TIMEOUT,
      deadline: DEFAULT_DEADLINE,
      nextProcessAt: DEFAULT_PROCESS_AT,
    };
    const got = await client.enqueue(task, opts);

    expect(got).toMatchObject(want);
  });

  test("Negative retry count", async () => {
    const opts: Partial<Options> = { retry: -5 };
    const want: Partial<TaskInfo> = {
      queue: DEFAULT_QUEUE,
      type: task.typeName,
      payload: task.payload,
      state: TaskState.TaskStatePending,
      maxRetry: 0, // retry count should be set to zero (0)
      retried: 0,
      lastErr: "",
      lastFailedAt: 0,
      timeout: DEFAULT_TIMEOUT,
      deadline: DEFAULT_DEADLINE,
      nextProcessAt: DEFAULT_PROCESS_AT,
    };
    const got = await client.enqueue(task, opts);

    expect(got).toMatchObject(want);
  });

  test.skip("Conflicting options", () => {
    // testing for multiple of the same option being
    // defined, with the latter taking precedence
    //
    // with TypeScript objects however we see the following
    // error with the below code:
    //  An object literal cannot have multiple properties with the same name.
    // const opts: Partial<Options> = { retry: -5, retry: 12 };
    //                                             ~~~~~
  });

  test("With queue option", async () => {
    const opts: Partial<Options> = { queue: "custom" };
    const want: Partial<TaskInfo> = {
      queue: "custom",
      type: task.typeName,
      payload: task.payload,
      state: TaskState.TaskStatePending,
      maxRetry: DEFAULT_MAX_RETRY,
      retried: 0,
      lastErr: "",
      lastFailedAt: 0,
      timeout: DEFAULT_TIMEOUT,
      deadline: DEFAULT_DEADLINE,
      nextProcessAt: DEFAULT_PROCESS_AT,
    };
    const got = await client.enqueue(task, opts);

    expect(got).toMatchObject(want);
  });

  test("Queue option should be case sensitive", async () => {
    const opts: Partial<Options> = { queue: "CustomQUEUE" };
    const want: Partial<TaskInfo> = {
      queue: "CustomQUEUE",
      type: task.typeName,
      payload: task.payload,
      state: TaskState.TaskStatePending,
      maxRetry: DEFAULT_MAX_RETRY,
      retried: 0,
      lastErr: "",
      lastFailedAt: 0,
      timeout: DEFAULT_TIMEOUT,
      deadline: DEFAULT_DEADLINE,
      nextProcessAt: DEFAULT_PROCESS_AT,
    };
    const got = await client.enqueue(task, opts);

    expect(got).toMatchObject(want);
  });

  test("With timeout option", async () => {
    const opts: Partial<Options> = { timeout: 1000 * 20 };
    const want: Partial<TaskInfo> = {
      queue: DEFAULT_QUEUE,
      type: task.typeName,
      payload: task.payload,
      state: TaskState.TaskStatePending,
      maxRetry: DEFAULT_MAX_RETRY,
      retried: 0,
      lastErr: "",
      lastFailedAt: 0,
      timeout: 1000 * 20,
      deadline: DEFAULT_DEADLINE,
      nextProcessAt: DEFAULT_PROCESS_AT,
    };
    const got = await client.enqueue(task, opts);

    expect(got).toMatchObject(want);
  });

  test("With deadline option", async () => {
    const deadline = Math.floor(new Date(2020, 5, 24).getTime() / 1000);
    const opts: Partial<Options> = { deadline };
    const want: Partial<TaskInfo> = {
      queue: DEFAULT_QUEUE,
      type: task.typeName,
      payload: task.payload,
      state: TaskState.TaskStatePending,
      maxRetry: DEFAULT_MAX_RETRY,
      retried: 0,
      lastErr: "",
      lastFailedAt: 0,
      timeout: NO_TIMEOUT,
      deadline,
      nextProcessAt: DEFAULT_PROCESS_AT,
    };
    const got = await client.enqueue(task, opts);

    expect(got).toMatchObject(want);
  });

  test("With both deadline and timeout options", async () => {
    const deadline = Math.floor(new Date(2020, 5, 24).getTime() / 1000);
    const timeout = 1000 * 20;
    const opts: Partial<Options> = { deadline, timeout };
    const want: Partial<TaskInfo> = {
      queue: DEFAULT_QUEUE,
      type: task.typeName,
      payload: task.payload,
      state: TaskState.TaskStatePending,
      maxRetry: DEFAULT_MAX_RETRY,
      retried: 0,
      lastErr: "",
      lastFailedAt: 0,
      timeout,
      deadline,
      nextProcessAt: DEFAULT_PROCESS_AT,
    };
    const got = await client.enqueue(task, opts);

    expect(got).toMatchObject(want);
  });

  test.todo("With retention option");
});
