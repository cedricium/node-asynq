import { randomUUID } from "crypto";
import { Broker } from "./broker";
import { DEFAULT_OPTIONS, Options } from "./options";
import { Task } from "./task";
import { TaskMessage } from "./task-message";

/**
 * A Client is responsible for scheduling tasks.
 * A Client is used to register tasks that should be processed immediately or some time in the future.
 */
export class Client {
  private broker;

  constructor() {
    this.broker = new Broker();
  }

  /**
   * `enqueue` enqueues the given task to a queue.
   *
   * `enqueue` returns TaskInfo and nil error if the task is enqueued successfully, otherwise returns a non-nil error.
   *
   * The argument opts specifies the behavior of task processing.
   * If there are conflicting options values the last one overrides others.
   * Any options provided to Task can be overridden by options passed to `enqueue`.
   * By default, max retry is set to 25 and timeout is set to 30 minutes.
   *
   * If no `opts.processAt` option is provided, the task will be pending immediately.
   */
  async enqueue(task: Task, opts: Partial<Options>): Promise<void> {
    const mergedOpts: Options = { ...DEFAULT_OPTIONS, ...task.opts, ...opts };
    const message = new TaskMessage();
    message.id = randomUUID();
    message.type = task.typeName;
    message.payload = task.payload;
    message.queue = mergedOpts.queue;
    message.retry = mergedOpts.retry;
    message.timeout = mergedOpts.timeout;
    message.deadline = mergedOpts.deadline;

    if (mergedOpts.processAt <= Date.now()) {
      await this.broker._enqueue(message);
    } else {
      await this.broker._schedule(message, mergedOpts.processAt);
    }
  }
}
