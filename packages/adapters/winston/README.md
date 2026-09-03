# @mushinn/winston

The [Winston](https://github.com/winstonjs/winston) adapter for **Mushin**, a multi-tenant, extensible logging library for Node.js.

`WinstonAdapter` plugs into [`@mushinn/core`](https://www.npmjs.com/package/@mushinn/core) and sends every structured `LogEntry` to the console **and** to daily-rotating log files.

## Installation

```bash
npm install @mushinn/core @mushinn/winston
```

> Requires **Node.js >= 20**. `@mushinn/core` is a peer dependency.

## Usage

Configure `LoggerService` **once** at startup with a `WinstonAdapter` instance. After that, use `@Loggable()` and `LoggerService` anywhere — see the [`@mushinn/core`](https://www.npmjs.com/package/@mushinn/core) docs.

```ts
import { LoggerService, LoggerLevel } from "@mushinn/core";
import { WinstonAdapter } from "@mushinn/winston";

LoggerService.configure(
  new WinstonAdapter({
    // DEBUG is the most verbose level — info/warn/error/debug all pass.
    level: LoggerLevel.DEBUG,
    logDirectory: "./logs",
  })
);
```

## Options

All options are optional.

```ts
new WinstonAdapter({
  level: LoggerLevel.DEBUG,  // default: DEBUG
  logDirectory: "./logs",    // default: "./logs"
  datePattern: "DD-MM-YYYY", // default: "DD-MM-YYYY"
  zippedArchive: false,      // default: false
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `LoggerLevel` | `DEBUG` | Minimum level to emit. |
| `logDirectory` | `string` | `"./logs"` | Directory for rotating log files. |
| `datePattern` | `string` | `"DD-MM-YYYY"` | Rotation/date pattern used in filenames. |
| `zippedArchive` | `boolean` | `false` | Gzip rotated log files. |

## Behavior

- Logs are written as JSON to the **console** and to **daily-rotating files** named `log-%DATE%.log` inside `logDirectory`.
- Each emitted record includes the Mushin per-request fields — `threadId`, `userId`, `message`, `timestamp`, and `error` — so logs stay correlated across a request.
- Files rotate according to `datePattern`; set `zippedArchive: true` to gzip rotated files.

## Related packages

| Package | Description |
| --- | --- |
| [`@mushinn/core`](https://www.npmjs.com/package/@mushinn/core) | Core API — `LoggerService`, `@Loggable`, `AsyncContextService`, middleware, interfaces. |
| [`@mushinn/winston`](https://www.npmjs.com/package/@mushinn/winston) | Winston adapter — console + daily-rotating file transport. |

## License

MIT
