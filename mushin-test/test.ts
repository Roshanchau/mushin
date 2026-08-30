import {
  Loggable,
  LoggerLevel,
  LoggerService,
  requestContextMiddleware,
  AsyncContextService
} from "@mushinn/core";

import { WinstonAdapter } from "@mushinn/winston";

LoggerService.configure(
  new WinstonAdapter({
    // DEBUG is the most verbose level, so info/warn/error/debug all pass.
    // (At level INFO, debug would be filtered out by winston.)
    level: LoggerLevel.DEBUG,
    logDirectory: "./logs"
  })
);

class UserService {
  // entry + exit metrics (response + timeTaken)
  @Loggable()
  getUser(id: string) {
    return {
      id,
      // proves we can read the per-request context inside the method
      threadId: AsyncContextService.getThreadId()
    };
  }

  // exercises timeTaken metric with a real async delay
  @Loggable()
  async fetchUserSlow(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { id, source: "db" };
  }

  // exercises the error branch (LoggerService.error + timeTaken)
  @Loggable()
  getUserFail(id: string) {
    throw new Error(`User ${id} not found`);
  }
}

/**
 * Simulate an incoming HTTP request going through requestContextMiddleware.
 * The middleware opens a fresh AsyncLocalStorage context and assigns a
 * unique threadId; everything the handler awaits stays inside that context,
 * so @Loggable picks up the threadId automatically.
 *
 * (In a real app this is `app.use(requestContextMiddleware)` — here we invoke
 * it directly with mock req/res so no HTTP server is needed.)
 */
function handleRequest(
  userId: string,
  handler: () => Promise<unknown> | unknown
): Promise<unknown> {
  const req = {} as any;
  const res = {} as any;
  return new Promise((resolve, reject) => {
    requestContextMiddleware(req, res, () => {
      // Simulate auth: after the middleware sets the threadId, attach the
      // authenticated user to the SAME async context. @Loggable picks it up.
      AsyncContextService.setUserId(userId);
      Promise.resolve(handler()).then(resolve, reject);
    });
  });
}

async function main() {
  const service = new UserService();

  // NOTE: @Loggable() wraps every method as async — all calls return a Promise.

  // --- Request 1: gets its own threadId + userId ---
  const r1 = await handleRequest("user-alice", () => service.getUser("123"));
  console.log("req1 getUser ->", r1);

  // --- Request 2: a DIFFERENT threadId + userId, proving per-request isolation ---
  const r2 = await handleRequest("user-bob", async () => {
    await service.fetchUserSlow("456");
    try {
      await service.getUserFail("999");
    } catch (err) {
      console.log("req2 getUserFail threw (expected):", (err as Error).message);
    }
    return "req2 done";
  });
  console.log("req2 ->", r2);

  // --- Two concurrent requests: threadId + userId must NOT bleed across them ---
  await Promise.all([
    handleRequest("user-carol", () => service.fetchUserSlow("A")),
    handleRequest("user-dave", () => service.fetchUserSlow("B"))
  ]);

  // --- All four log levels via LoggerService directly, inside a context ---
  // (@Loggable only emits info/error, so warn & debug are exercised here.)
  await handleRequest("user-eve", () => {
    LoggerService.info("manual info message");
    LoggerService.warn("manual warn message");
    LoggerService.debug("manual debug message");
    LoggerService.error("manual error message");
  });
}

main();
