# @mushinn/core

The core of **Mushin** — a multi-tenant, extensible logging library for Node.js.

Mushin gives you **structured, per-request logging** with almost no boilerplate. You configure a logger **once** at startup, then use the `@Loggable()` decorator and `LoggerService` **anywhere** in your codebase. Every log line is automatically enriched with a per-request `threadId` and `userId` propagated through Node's `AsyncLocalStorage` — no manual context passing required.

This package ships the framework-agnostic API. Pair it with an adapter such as [`@mushinn/winston`](https://www.npmjs.com/package/@mushinn/winston) to actually emit logs.

## Features

- **Configure once, log everywhere** — a single `LoggerService.configure()` call at startup wires up the whole app.
- **`@Loggable()` decorator** — automatically logs method entry, exit, response, `timeTaken`, and errors.
- **Automatic request context** — `threadId` (and optional `userId`) flow through async calls via `AsyncLocalStorage`, so concurrent requests never bleed into each other.
- **Express middleware** — drop-in `requestContextMiddleware` opens a fresh context per HTTP request.
- **Pluggable adapters** — implement `LoggerAdapter` to target any backend.

## Installation

```bash
# core is always required
npm install @mushinn/core

# plus at least one adapter
npm install @mushinn/winston
```

> Requires **Node.js >= 20**.

### TypeScript configuration

`@Loggable()` is a method decorator, so enable decorator support in your `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Quick start

The library is used in two steps:

1. **Once, at startup** — configure `LoggerService` with an adapter.
2. **Anywhere else** — use `@Loggable()` and `LoggerService` without any further setup.

### 1. Configure the logger once (application startup)

Do this a **single time**, as early as possible in your app's entry point (e.g. `main.ts` / `index.ts`). Calling `LoggerService.configure()` more than once throws an error — this is intentional, so the whole app shares one consistent logger.

```ts
import { LoggerService, LoggerLevel } from "@mushinn/core";
import { WinstonAdapter } from "@mushinn/winston";

LoggerService.configure(
  new WinstonAdapter({
    // DEBUG is the most verbose level — info/warn/error/debug all pass.
    // At level INFO, debug messages would be filtered out.
    level: LoggerLevel.DEBUG,
    logDirectory: "./logs",
  })
);
```

### 2. Use `@Loggable()` anywhere

Once configured, decorate any class method. Mushin logs an **entry** line with the arguments, an **exit** line with the response and `timeTaken`, and an **error** line if the method throws.

```ts
import { Loggable, AsyncContextService } from "@mushinn/core";

class UserService {
  @Loggable()
  getUser(id: string) {
    return {
      id,
      // per-request context is readable inside the method
      threadId: AsyncContextService.getThreadId(),
    };
  }

  @Loggable()
  async fetchUserSlow(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { id, source: "db" };
  }

  @Loggable()
  getUserFail(id: string) {
    // the error branch logs `error` + `timeTaken`, then rethrows
    throw new Error(`User ${id} not found`);
  }
}
```

> **Note:** `@Loggable()` wraps every method as `async`, so decorated methods always return a `Promise`. Use `await` (or `.then()`) when calling them.

### 3. Log manually with `LoggerService`

For messages that aren't tied to a method boundary, call `LoggerService` directly. All four levels are available:

```ts
import { LoggerService } from "@mushinn/core";

LoggerService.info("manual info message");
LoggerService.warn("manual warn message");
LoggerService.debug("manual debug message");
LoggerService.error("manual error message", new Error("something failed"));
```

## Per-request context

Mushin uses `AsyncLocalStorage` so that a `threadId` (and optional `userId`) automatically attach to every log line produced during a request — including inside anything the request `await`s. Concurrent requests each get an isolated context, so their IDs never bleed across each other.

### With Express

Register `requestContextMiddleware` once. It opens a fresh context and assigns a unique `threadId` (a UUID v7) for every incoming request.

```ts
import express from "express";
import { requestContextMiddleware, AsyncContextService } from "@mushinn/core";

const app = express();

// opens a new async context + threadId for each request
app.use(requestContextMiddleware);

// after authentication, attach the user to the same context
app.use((req, res, next) => {
  AsyncContextService.setUserId(/* req.user.id */ "user-123");
  next();
});

app.get("/users/:id", async (req, res) => {
  const service = new UserService();
  // every @Loggable / LoggerService call below carries this request's
  // threadId + userId automatically
  res.json(await service.getUser(req.params.id));
});
```

### Without Express

You can drive the context manually — useful for jobs, workers, or tests:

```ts
import { requestContextMiddleware, AsyncContextService } from "@mushinn/core";

function handleRequest(
  userId: string,
  handler: () => Promise<unknown> | unknown
): Promise<unknown> {
  const req = {} as any;
  const res = {} as any;
  return new Promise((resolve, reject) => {
    // middleware opens a fresh context + threadId
    requestContextMiddleware(req, res, () => {
      // attach the authenticated user to the SAME context
      AsyncContextService.setUserId(userId);
      Promise.resolve(handler()).then(resolve, reject);
    });
  });
}

const service = new UserService();

// each call gets its own isolated threadId + userId
await handleRequest("user-alice", () => service.getUser("123"));
await handleRequest("user-bob", () => service.fetchUserSlow("456"));

// concurrent requests stay isolated — IDs never bleed across them
await Promise.all([
  handleRequest("user-carol", () => service.fetchUserSlow("A")),
  handleRequest("user-dave", () => service.fetchUserSlow("B")),
]);
```

### `AsyncContextService` API

| Method | Description |
| --- | --- |
| `runWithNewContext(fn)` | Runs `fn` inside a brand-new async context store. |
| `setThreadId(id)` / `getThreadId()` | Set / read the current request's thread ID. |
| `setUserId(id)` / `getUserId()` | Set / read the current request's user ID. |
| `set(key, value)` / `get(key)` | Store / read arbitrary keys on the current context. |
| `getStore()` | Return the raw context store (or `undefined` outside a context). |

## API reference

### `LoggerService`

Static, app-wide logging facade.

- `LoggerService.configure(adapter)` — **call once at startup.** Wires the adapter; throws if called more than once.
- `LoggerService.info(message)`
- `LoggerService.warn(message)`
- `LoggerService.debug(message)`
- `LoggerService.error(message, error?)`

Calling any log method before `configure()` throws: *"LoggerService has not been configured. Call LoggerService.configure() during application startup."*

### `@Loggable()`

Method decorator. Logs:

- **entry** — `Class.method | entry | args: [...]`
- **exit** — `Class.method | exit | response: ... | timeTaken: <n>ms`
- **error** — `Class.method | error: <message> | timeTaken: <n>ms` (then rethrows)

### `LoggerLevel`

```ts
enum LoggerLevel {
  INFO = "info",
  ERROR = "error",
  WARN = "warn",
  DEBUG = "debug",
}
```

### `LogEntry`

The structured object passed to every adapter:

```ts
interface LogEntry {
  level: LoggerLevel;
  message: string;
  timestamp: string;
  threadId: string;
  userId: string;
  error?: unknown;
  traceId?: string;
  spanId?: string;
  eventName?: string;
}
```

## Writing a custom adapter

Implement the `LoggerAdapter` interface and pass an instance to `LoggerService.configure()`:

```ts
import { LoggerAdapter, LogEntry } from "@mushinn/core";

export class ConsoleAdapter implements LoggerAdapter {
  log(entry: LogEntry): void {
    console.log(JSON.stringify(entry));
  }
}

LoggerService.configure(new ConsoleAdapter());
```

## Related packages

| Package | Description |
| --- | --- |
| [`@mushinn/core`](https://www.npmjs.com/package/@mushinn/core) | Core API — `LoggerService`, `@Loggable`, `AsyncContextService`, middleware, interfaces. |
| [`@mushinn/winston`](https://www.npmjs.com/package/@mushinn/winston) | Winston adapter — console + daily-rotating file transport. |

## License

ISC
