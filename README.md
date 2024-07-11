# node-asynq

**Node.js client for the [Asynq](https://github.com/hibiken/asynq) task queue
library.**

`node-asynq` allows you to produce and queue tasks in Node.js applications and
consume them with Go worker servers, giving you the flexibility to use the best
tool for the job.

This package aims to offer capabilities nearly identical to those of
[`Client`](https://pkg.go.dev/github.com/hibiken/asynq#Client).

## Motivation

This project serves to enhance my TypeScript and Node.js skills while
contributing to the open-source community. It originated from the necessity for
clients in additional languages (refer to hibiken/asynq#105).

## Status

> [!WARNING]
>
> This library is currently in its early stages and may undergo frequent and
> potentially breaking changes. Use with caution until further stabilization.

However, contributions such as code, documentation, or testing are highly
encouraged and appreciated.

## Getting Started

### Prerequisites

<!-- minimum Node.js version? -->
<!-- Redis Docker container -->

Tasks defined in your Go application. The "Basic Usage" example assumes the
following Go `asynq` setup:

```go
package tasks

import (
    "context"
    "encoding/json"
    "fmt"
    "log"

    "github.com/hibiken/asynq"
)

const (
    TypeEmailDelivery   = "email:deliver"
)

type EmailDeliveryPayload struct {
    UserID     int
    TemplateID string
}

func HandleEmailDeliveryTask(ctx context.Context, t *asynq.Task) error {
    var p EmailDeliveryPayload
    if err := json.Unmarshal(t.Payload(), &p); err != nil {
        return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
    }
    log.Printf("Sending Email to User: user_id=%d, template_id=%s", p.UserID, p.TemplateID)
    // Email delivery code ...
    return nil
}
```

### Installation

```shell
npm install node-asynq
```

## Basic Usage

```typescript
// Import node-asynq and the relevant classes.
import { Client, Task } from "node-asynq";

// Create a Client instance to start registering tasks.
// By default, the underlying Redis broker will connect to localhost:6379.
// TODO: implement `asynq.RedisConnOpt`
const queue = new Client();

// Next, define a Task for processing.
// The first argument is the type of task,
// followed by the task's payload.
const task = new Task("email:deliver", { userId: 42, templateId: "OkcBMj" });

// Example 1: Enqueue task to be processed immediately.
await queue.enqueue(task);

// Example 2: Schedule task to be processed in the future.
// Below the task is scheduled to be processed in 5 minutes from now.
await queue.enqueue(task, { processAt: Date.now() + 1000 * 60 * 5 });
```

That's it! If you have the
[Asynqmon web UI](https://github.com/hibiken/asynq/tree/master?tab=readme-ov-file#web-ui)
or
[`asynq` CLI](https://github.com/hibiken/asynq/tree/master?tab=readme-ov-file#command-line-tool)
tools running, you should be able to verify the tasks were queued. Additionally
and most importantly, the Go workers will be able to dequeue and process these
tasks, enabling cross-platform task queueing. 🎉

## License

Copyright (c) 2024 Cedric Amaya and contributors. node-asynq is free and
open-source software licensed under the [MIT License](./LICENSE).
