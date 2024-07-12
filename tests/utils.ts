import { randomUUID } from "crypto";
import {
  DEFAULT_DEADLINE,
  DEFAULT_MAX_RETRY,
  DEFAULT_QUEUE,
  DEFAULT_TIMEOUT,
} from "../src/options";
import { TaskMessage } from "../src/task-message";
import { JSONValue } from "../src";

// TODO: place all h.<method> testutil.go functions here

/** taskMessage returns a new instance of TaskMessage given a task type and payload. */
export function taskMessage(taskType: string, payload: JSONValue): TaskMessage {
  return taskMessageWithQueue(taskType, payload, DEFAULT_QUEUE);
}

/**
 * taskMessageWithQueue returns a new instance of TaskMessage given a
 * task type, payload and queue name.
 */
export function taskMessageWithQueue(
  taskType: string,
  payload: JSONValue,
  qname: string
): TaskMessage {
  const message = new TaskMessage();
  message.id = randomUUID();
  message.type = taskType;
  message.queue = qname;
  message.retry = DEFAULT_MAX_RETRY;
  message.payload = Buffer.from(JSON.stringify(payload));
  message.timeout = DEFAULT_TIMEOUT;
  message.deadline = DEFAULT_DEADLINE;

  return message;
}
