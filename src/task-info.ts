import { TaskMessage } from "./task-message";

/** TaskState denotes the state of a task. */
export enum TaskState {
  /** Indicates that the task is currently being processed by Handler. */
  TaskStateActive = 1,

  /** Indicates that the task is ready to be processed by Handler. */
  TaskStatePending,

  /** Indicates that the task is scheduled to be processed some time in the future. */
  TaskStateScheduled,

  /** Indicates that the task has previously failed and scheduled to be processed some time in the future. */
  TaskStateRetry,

  /** Indicates that the task is archived and stored for inspection purposes. */
  TaskStateArchived,

  /** Indicates that the task is processed successfully and retained until the retention TTL expires. */
  TaskStateCompleted,

  /** Indicates that the task is waiting in a group to be aggregated into one task. */
  TaskStateAggregating,
}

function taskStateToString(state: TaskState): string {
  switch (state) {
    case TaskState.TaskStateActive:
      return "active";
    case TaskState.TaskStatePending:
      return "pending";
    case TaskState.TaskStateScheduled:
      return "scheduled";
    case TaskState.TaskStateRetry:
      return "retry";
    case TaskState.TaskStateArchived:
      return "archived";
    case TaskState.TaskStateCompleted:
      return "completed";
    case TaskState.TaskStateAggregating:
      return "aggregating";
    default:
      throw new Error("unknown task state");
  }
}

/** A TaskInfo describes a task and its metadata. */
export class TaskInfo {
  // ID is the identifier of the task.
  id: string;

  // Queue is the name of the queue in which the task belongs.
  queue: string;

  // Type is the type name of the task.
  type: string;

  // Payload is the payload data of the task.
  payload: Buffer;

  // State indicates the task state.
  state: TaskState;

  // MaxRetry is the maximum number of times the task can be retried.
  maxRetry: number;

  // Retried is the number of times the task has retried so far.
  retried: number;

  // LastErr is the error message from the last failure.
  lastErr: string;

  // LastFailedAt is the time time of the last failure if any.
  // If the task has no failures, LastFailedAt is zero time (i.e. time.Time{}).
  lastFailedAt: number;

  // Timeout is the duration the task can be processed by Handler before being retried,
  // zero if not specified
  timeout: number;

  // Deadline is the deadline for the task, zero value if not specified.
  deadline: number;

  // Group is the name of the group in which the task belongs.
  //
  // Tasks in the same queue can be grouped together by Group name and will be aggregated into one task
  // by a Server processing the queue.
  //
  // Empty string (default) indicates task does not belong to any groups, and no aggregation will be applied to the task.
  group: string;

  // NextProcessAt is the time the task is scheduled to be processed,
  // zero if not applicable.
  nextProcessAt: number;

  // IsOrphaned describes whether the task is left in active state with no worker processing it.
  // An orphaned task indicates that the worker has crashed or experienced network failures and was not able to
  // extend its lease on the task.
  //
  // This task will be recovered by running a server against the queue the task is in.
  // This field is only applicable to tasks with TaskStateActive.
  isOrphaned: boolean = false;

  // Retention is duration of the retention period after the task is successfully processed.
  retention: number;

  // CompletedAt is the time when the task is processed successfully.
  // Zero value (i.e. time.Time{}) indicates no value.
  completedAt: number;

  // Result holds the result data associated with the task.
  // Use ResultWriter to write result data from the Handler.
  result?: Buffer;

  constructor(
    msg: TaskMessage,
    state: TaskState,
    nextProcessAt: number,
    result?: Buffer
  ) {
    this.id = msg.id;
    this.queue = msg.queue;
    this.type = msg.type;
    this.payload = msg.payload;
    this.maxRetry = msg.retry;
    this.retried = msg.retried;
    this.lastErr = msg.error_msg;
    this.group = msg.group_key;
    this.timeout = msg.timeout; // time.Duration(msg.Timeout) * time.Second,
    this.deadline = msg.deadline; // fromUnixTimeOrZero(msg.Deadline),
    this.retention = msg.retention; // time.Duration(msg.Retention) * time.Second,
    this.nextProcessAt = nextProcessAt;
    this.lastFailedAt = msg.last_failed_at; // fromUnixTimeOrZero(msg.LastFailedAt),
    this.completedAt = msg.completed_at; // fromUnixTimeOrZero(msg.CompletedAt),
    this.result = result;

    switch (state) {
      case TaskState.TaskStateActive:
        this.state = TaskState.TaskStateActive;
        break;
      case TaskState.TaskStatePending:
        this.state = TaskState.TaskStatePending;
        break;
      case TaskState.TaskStateScheduled:
        this.state = TaskState.TaskStateScheduled;
        break;
      case TaskState.TaskStateRetry:
        this.state = TaskState.TaskStateRetry;
        break;
      case TaskState.TaskStateArchived:
        this.state = TaskState.TaskStateArchived;
        break;
      case TaskState.TaskStateCompleted:
        this.state = TaskState.TaskStateCompleted;
        break;
      case TaskState.TaskStateAggregating:
        this.state = TaskState.TaskStateAggregating;
        break;
      default:
        throw new Error(`internal error: unknown state: ${state}`);
    }
  }
}
