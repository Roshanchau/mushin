import {
  createLogger,
  format,
  transports,
  Logger,
} from "winston";

import DailyRotateFile from "winston-daily-rotate-file";

import {
  LoggerAdapter,
  LogEntry,
    LoggerLevel
} from "@muchin/core";

export interface WinstonAdapterOptions {
  level?: LoggerLevel;
  logDirectory?: string;
  datePattern?: string;
  zippedArchive?: boolean;
}

export class WinstonAdapter implements LoggerAdapter {
  private readonly logger: Logger;

  constructor(
    options: WinstonAdapterOptions = {}
  ) {
    const {
      level = LoggerLevel.DEBUG,
      logDirectory = "./logs",
      datePattern = "DD-MM-YYYY",
      zippedArchive = false,
    } = options;

    this.logger = createLogger({
      level,

      format: format.json(),

      transports: [
        new transports.Console(),

        new DailyRotateFile({
          dirname: logDirectory,
          filename: "log-%DATE%.log",
          datePattern,
          zippedArchive,
        }),
      ],
    });
  }

  log(entry: LogEntry): void {
    this.logger.log({
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      attributes: entry.attributes,
      error: entry.error,
    });
  }
}