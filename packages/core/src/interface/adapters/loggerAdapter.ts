import { LogEntry } from "../logEntry.js";

export interface LoggerAdapter {
  log(entry: LogEntry): void;
}