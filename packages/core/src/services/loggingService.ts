import { LoggerAdapter } from "../interface/adapters/loggerAdapter.js";
import { LoggerLevel } from "../enums/logLevel.js";
import { AsyncContextService } from "./asyncContextService.js";
import { logTimeStamp } from "../utils/dateUtil.js";
import { LogEntry } from "../interface/logEntry.js";

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
  attributes?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: logTimeStamp(),
    attributes: {
      ...attributes,
      userId: AsyncContextService.getUserId(),
      threadId: AsyncContextService.getThreadId(),
    },
  };
}

  private static log(
    level: LoggerLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const entry = this.buildEntry(
      level,
      message,
      context
    );

    this.getAdapter().log(entry);
  }

  static info(
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log(LoggerLevel.INFO, message, context);
  }

  static error(
    message: string,
    context?: Record<string, unknown>,
    error?: unknown
  ): void {
    const entry = this.buildEntry(
      LoggerLevel.ERROR,
      message,
      context
    );

    entry.error = error;

    this.getAdapter().log(entry);
  }

  static warn(
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log(LoggerLevel.WARN, message, context);
  }

  static debug(
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log(LoggerLevel.DEBUG, message, context);
  }
}