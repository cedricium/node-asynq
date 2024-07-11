import path = require("node:path");
import protobuf from "protobufjs";

let TaskMessageType: protobuf.Type;
run().catch(console.error);
async function run() {
  const root = await protobuf.load(
    path.join(__dirname, "..", "proto", "asynq.proto")
  );
  TaskMessageType = root.lookupType("asynq.TaskMessage");
}

/**
 * TaskMessage is the internal representation of a task with additional metadata fields.
 * Serialized data of this type gets written to redis.
 */
export class TaskMessage {
  /** Type indicates the kind of the task to be performed. */
  type: string = "";

  /** Payload holds data needed to process the task. */
  payload: Buffer = Buffer.alloc(0);

  /** ID is a unique identifier for each task. */
  id: string = "";

  /** Queue is a name this message should be enqueued to. */
  queue: string = "";

  /** Retry is the max number of retry for this task. */
  retry: number = 0;

  /** Retried is the number of times we've retried this task so far. */
  retried: number = 0;

  /** ErrorMsg holds the error message from the last failure. */
  error_msg: string = "";

  /**
   * Time of last failure in Unix time,
   * the number of seconds elapsed since January 1, 1970 UTC.
   *
   * Use zero to indicate no last failure
   * */
  last_failed_at: number = 0;

  /**
   * Timeout specifies timeout in seconds.
   * If task processing doesn't complete within the timeout, the task will be retried
   * if retry count is remaining. Otherwise it will be moved to the archive.
   *
   * Use zero to indicate no timeout.
   */
  timeout: number = 0;

  /**
   * Deadline specifies the deadline for the task in Unix time,
   * the number of seconds elapsed since January 1, 1970 UTC.
   * If task processing doesn't complete before the deadline, the task will be retried
   * if retry count is remaining. Otherwise it will be moved to the archive.
   *
   * Use zero to indicate no deadline.
   */
  deadline: number = 0;

  /**
   * UniqueKey holds the redis key used for uniqueness lock for this task.
   *
   * Empty string indicates that no uniqueness lock was used.
   */
  unique_key: string = "";

  /**
   * GroupKey holds the group key used for task aggregation.
   *
   * Empty string indicates no aggregation is used for this task.
   */
  group_key: string = "";

  /** Retention specifies the number of seconds the task should be retained after completion. */
  retention: number = 0;

  /**
   * CompletedAt is the time the task was processed successfully in Unix time,
   * the number of seconds elapsed since January 1, 1970 UTC.
   *
   * Use zero to indicate no value.
   */
  completed_at: number = 0;

  static encodeMessage(message: TaskMessage) {
    return TaskMessageType.encode(message).finish();
  }
}
