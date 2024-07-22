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
  private broker: Broker;

  constructor(redisConnectOpt?: RedisClientOpt) {
    const redis = redisConnectOpt ? new Redis(redisConnectOpt) : new Redis();
    this.broker = new Broker(redis);
  }

  private createTaskMessage(task: Task, options: Options): TaskMessage {
    const message = new TaskMessage();
    message.id = randomUUID();
    message.type = task.typeName;
    message.payload = task.payload;
    message.queue = options.queue;
    message.retry = Math.max(0, options.retry);
    message.timeout = this.getTimeout(options);
    message.deadline =
      options.deadline !== NO_DEADLINE ? options.deadline : NO_DEADLINE;
    return message;
  }

  private getTimeout(options: Options): number {
    if (options.deadline === NO_DEADLINE && options.timeout === NO_TIMEOUT) {
      return DEFAULT_TIMEOUT;
    }
    return options.timeout !== NO_TIMEOUT ? options.timeout : NO_TIMEOUT;
  }

  private getTaskState(processAt: number): TaskState {
    return processAt > Date.now()
      ? TaskState.TaskStateScheduled
      : TaskState.TaskStatePending;
  }

  private mergeOptions(
    taskOpts?: Partial<Options>,
    enqueueOpts?: Partial<Options>
  ): Options {
    return { ...DEFAULT_OPTIONS, ...taskOpts, ...enqueueOpts };
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
    const options = this.mergeOptions(task.opts, opts);
    const message = this.createTaskMessage(task, options);
    const state = this.getTaskState(options.processAt);

    if (state === TaskState.TaskStateScheduled) {
      await this.broker.schedule(message, options.processAt);
    } else {
      await this.broker.enqueue(message);
    }

    return new TaskInfo(message, state, options.processAt);
  }

  async bulkEnqueue(
    tasks: Task[],
    opts?: Partial<Options>
  ): Promise<TaskInfo[]> {
    const taskInfoList: TaskInfo[] = [];
    const messages: { pending: TaskMessage[]; scheduled: TaskMessage[] } = {
      pending: [],
      scheduled: [],
    };

    for (const task of tasks) {
      const options = this.mergeOptions(task.opts, opts);
      const message = this.createTaskMessage(task, options);
      const state = this.getTaskState(options.processAt);

      if (state === TaskState.TaskStateScheduled) {
        messages.scheduled.push(message);
      } else {
        messages.pending.push(message);
      }

      taskInfoList.push(new TaskInfo(message, state, options.processAt));
    }

    await this.broker.bulkQueue(messages.pending);
    await this.broker.bulkSchedule(messages.scheduled, opts?.processAt);

    return taskInfoList;
  }
}
