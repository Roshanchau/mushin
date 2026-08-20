import { LogEntry } from "../logEntry";
export interface LoggerAdapter {
  log(entry: LogEntry): void;
}