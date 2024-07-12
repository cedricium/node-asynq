import { AllQueues } from "./constants";
import { Redis, Redis as RedisInterface } from "ioredis";
import { TaskMessage } from "./task-message";

interface RedisJobQueue extends RedisInterface {
  enqueue?(
    keys: string[],
    args: (string | number | Uint8Array)[]
  ): Promise<void>;
  schedule?(
    keys: string[],
    args: (string | number | Uint8Array)[]
  ): Promise<void>;
}

/**
 * A Broker encapsulates the interactions with redis.
 * It is a client interface used to mutate task queues.
 */
export class Broker {
  private redis: RedisJobQueue;

  constructor(client: Redis) {
    this.redis = client;
  }

  /** `_enqueue` adds the given task to the pending list of the queue. */
  async _enqueue(message: TaskMessage): Promise<void> {
    // enqueueCmd enqueues a given task message.
    //
    // Input:
    // KEYS[1] -> asynq:{<qname>}:t:<task_id>
    // KEYS[2] -> asynq:{<qname>}:pending
    // --
    // ARGV[1] -> task message data
    // ARGV[2] -> task ID
    // ARGV[3] -> current unix time in nsec
    //
    // Output:
    // Returns 1 if successfully enqueued
    // Returns 0 if task ID already exists
    const enqueueCmd = `
if redis.call("EXISTS", KEYS[1]) == 1 then
	return 0
end
redis.call("HSET", KEYS[1],
           "msg", ARGV[1],
           "state", "pending",
           "pending_since", ARGV[3])
redis.call("LPUSH", KEYS[2], ARGV[2])
return 1`;

    await this.redis.sadd(AllQueues, message.queue);
    const taskKey = `asynq:{${message.queue}}:t:${message.id}`;
    const pendingKey = `asynq:{${message.queue}}:pending`;
    const keyList = [taskKey, pendingKey];
    const argList = [
      await TaskMessage.encodeMessage(message),
      message.id,
      Math.floor(Date.now() / 1000),
    ];

    this.redis.defineCommand("enqueue", {
      numberOfKeys: 2,
      lua: enqueueCmd,
    });
    await this.redis.enqueue?.(keyList, argList);
  }

  /** `_schedule` adds the task to the scheduled set to be processed in the future. */
  async _schedule(message: TaskMessage, processAt: number): Promise<void> {
    // scheduleCmd enqueues a given task message
    // to be processed in the future.
    //
    // KEYS[1] -> asynq:{<qname>}:t:<task_id>
    // KEYS[2] -> asynq:{<qname>}:scheduled
    // -------
    // ARGV[1] -> task message data
    // ARGV[2] -> process_at time in Unix time
    // ARGV[3] -> task ID
    //
    // Output:
    // Returns 1 if successfully enqueued
    // Returns 0 if task ID already exists
    const scheduleCmd = `
  if redis.call("EXISTS", KEYS[1]) == 1 then
    return 0
  end
  redis.call("HSET", KEYS[1],
             "msg", ARGV[1],
             "state", "scheduled")
  redis.call("ZADD", KEYS[2], ARGV[2], ARGV[3])
  return 1`;

    await this.redis.sadd(AllQueues, message.queue);
    const taskKey = `asynq:{${message.queue}}:t:${message.id}`;
    const pendingKey = `asynq:{${message.queue}}:scheduled`;
    const keyList = [taskKey, pendingKey];
    const argList = [
      await TaskMessage.encodeMessage(message),
      Math.floor(processAt / 1000),
      message.id,
    ];

    this.redis.defineCommand("schedule", {
      numberOfKeys: 2,
      lua: scheduleCmd,
    });
    await this.redis.schedule?.(keyList, argList);
  }
}
