import { randomUUID } from "crypto";
import { Redis } from "ioredis";
import { Broker } from "./broker";
import {
  DEFAULT_OPTIONS,
  DEFAULT_TIMEOUT,
  NO_DEADLINE,
  NO_TIMEOUT,
  Options,
} from "./options";
import { Task } from "./task";
import { TaskMessage } from "./task-message";
import { TaskInfo, TaskState } from "./task-info";

type RedisClientOpt = {
  /**
   * Network type to use, either tcp or unix.
   * Default is tcp.
   */
  // network: string;

  /** Redis server address in "host:port" format. */
  // addr: string;

  /**
   * Redis server host. Default is "127.0.0.1"
   * @default "127.0.0.1"
   */
  host?: string;

  /**
   * Redis server port. Default is 6739.
   * @default 6379
   */
  port?: number;

  /**
   * Username to authenticate the current connection when Redis ACLs are used.
   * See: https://redis.io/commands/auth.
   */
  username?: string;

  /**
   * Password to authenticate the current connection.
   * See: https://redis.io/commands/auth.
   */
  password?: string;

  /**
   * Redis DB to select after connecting to a server.
   * See: https://redis.io/commands/select.
   */
  db?: number;

  /**
   * Dial timeout for establishing new connections.
   * Default is 5 seconds.
   * @default 5
   */
  // dialTimeout: number;

  /**
   * Timeout for socket reads.
   * If timeout is reached, read commands will fail with a timeout error
   * instead of blocking.
   *
   * Use value -1 for no timeout and 0 for default.
   * Default is 3 seconds.
   * @default 3
   */
  // readTimeout: number;

  /**
   * Timeout for socket writes.
   * If timeout is reached, write commands will fail with a timeout error
   * instead of blocking.
   *
   * Use value -1 for no timeout and 0 for default.
   * Default is ReadTimout.
   */
  // writeTimeout: number;

  /**
   * Maximum number of socket connections.
   * Default is 10 connections per every CPU as reported by runtime.NumCPU.
   * @default 10
   */
  // poolSize: number;

  /**
   * TLS Config used to connect to a server.
   * TLS will be negotiated only if this field is set.
   */
  // tlsConfig: *tls.Config
};

/**
 * A Client is responsible for scheduling tasks.
 * A Client is used to register tasks that should be processed immediately
 * or some time in the future.
 */
export class Client {
  private broker;

  constructor(redisConnectOpt: RedisClientOpt);
  constructor();
  constructor(opts?: RedisClientOpt) {
    const redis = opts ? new Redis(opts) : new Redis();
    this.broker = new Broker(redis);
  }

  /**
   * `enqueue` enqueues the given task to a queue.
   *
   * `enqueue` returns TaskInfo and nil error if the task is enqueued successfully,
   * otherwise returns a non-nil error.
   *
   * The argument opts specifies the behavior of task processing.
   * If there are conflicting options values the last one overrides others.
   * Any options provided to Task can be overridden by options passed to `enqueue`.
   * By default, max retry is set to 25 and timeout is set to 30 minutes.
   *
   * If no `opts.processAt` option is provided, the task will be pending immediately.
   */
  async enqueue(task: Task, opts?: Partial<Options>): Promise<TaskInfo> {
    const options: Options = { ...DEFAULT_OPTIONS, ...task.opts, ...opts };

    const deadline =
      options.deadline !== NO_DEADLINE ? options.deadline : NO_DEADLINE;
    let timeout = options.timeout !== NO_TIMEOUT ? options.timeout : NO_TIMEOUT;
    if (deadline === NO_DEADLINE && timeout === NO_TIMEOUT) {
      // If neither deadline nor timeout are set, use default timeout.
      timeout = DEFAULT_TIMEOUT;
    }

    const message = new TaskMessage();
    message.id = randomUUID();
    message.type = task.typeName;
    message.payload = task.payload;
    message.queue = options.queue;
    message.retry = options.retry < 0 ? 0 : options.retry;
    message.timeout = timeout;
    message.deadline = deadline;

    let state;
    if (options.processAt > Date.now()) {
      state = TaskState.TaskStateScheduled;
      await this.broker._schedule(message, options.processAt);
    } else {
      state = TaskState.TaskStatePending;
      await this.broker._enqueue(message);
    }

    return new TaskInfo(message, state, options.processAt);
  }

  async bulkEnqueue(
    tasks: Task[],
    opts?: Partial<Options>
  ): Promise<TaskInfo[]> {
    const taskInfoList: TaskInfo[] = [];
    const pendingMsgList: TaskMessage[] = [];
    const scheduledMsgList: TaskMessage[] = [];

    let options: Options = { ...DEFAULT_OPTIONS, ...opts };

    for (const task of tasks) {
      options = { ...options, ...task.opts };

      const deadline =
        options.deadline !== NO_DEADLINE ? options.deadline : NO_DEADLINE;
      let timeout =
        options.timeout !== NO_TIMEOUT ? options.timeout : NO_TIMEOUT;
      if (deadline === NO_DEADLINE && timeout === NO_TIMEOUT) {
        // If neither deadline nor timeout are set, use default timeout.
        timeout = DEFAULT_TIMEOUT;
      }

      const message = new TaskMessage();
      message.id = randomUUID();
      message.type = task.typeName;
      message.payload = task.payload;
      message.queue = options.queue;
      message.retry = options.retry < 0 ? 0 : options.retry;
      message.timeout = timeout;
      message.deadline = deadline;

      let info: TaskInfo;
      if (options.processAt > Date.now()) {
        const state = TaskState.TaskStateScheduled;
        info = new TaskInfo(message, state, options.processAt);
        scheduledMsgList.push(message);
      } else {
        const state = TaskState.TaskStatePending;
        info = new TaskInfo(message, state, options.processAt);
        pendingMsgList.push(message);
      }

      taskInfoList.push(info);
    }

    await this.broker._bulkQueue(pendingMsgList);
    await this.broker._bulkSchedule(scheduledMsgList, opts?.processAt);

    return taskInfoList;
  }
}
