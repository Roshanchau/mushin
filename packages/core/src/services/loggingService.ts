import { LoggerAdapter } from "../interface/adapters/loggerAdapter.js";
import { LoggerLevel } from "../enums/logLevel.js";
import { LogEntry } from "../interface/logEntry.js";
import { logTimeStamp } from "../utils/dateUtil.js";
import { AsyncContextService } from "./asyncContextService.js";
export class LoggerService {
  private static adapter: LoggerAdapter | null = null;

  static configure(adapter: LoggerAdapter): void {
    if (this.adapter !== null) {
      throw new Error(
        "LoggerService has already been configured."
      );
    }

    this.adapter = adapter;
  }

  private static getAdapter(): LoggerAdapter {
    if (this.adapter === null) {
      throw new Error(
        "LoggerService has not been configured. " +
        "Call LoggerService.configure() during application startup."
      );
    }

    return this.adapter;
  }

private static buildEntry(
  level: LoggerLevel,
  message: string,
): LogEntry {
  return {
    level,
    message,
    timestamp: logTimeStamp(),
    userId: AsyncContextService.getUserId() || "",
    threadId: AsyncContextService.getThreadId() || "",
  };
}

  private static log(
    level: LoggerLevel,
    message: string
  ): void {
    const entry = this.buildEntry(
      level,
      message
    );

    this.getAdapter().log(entry);
  }

  static info(
    message: string
  ): void {
    this.log(LoggerLevel.INFO, message);
  }

  static error(
    message: string,
    error?: unknown
  ): void {
    const entry = this.buildEntry(
      LoggerLevel.ERROR,
      message
    );

    entry.error = error;

    this.getAdapter().log(entry);
  }

  static warn(
    message: string
  ): void {
    this.log(LoggerLevel.WARN, message);
  }

  static debug(
    message: string
  ): void {
    this.log(LoggerLevel.DEBUG, message);
  }
}