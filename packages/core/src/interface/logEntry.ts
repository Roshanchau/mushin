import { LoggerLevel } from "../enums/logLevel";
export interface LogEntry {
  level: LoggerLevel;
  message: string;
  timestamp: string;
  attributes: Record<string, unknown>;
  error?: unknown;
  traceId?: string;
  spanId?: string;
  eventName?: string;
}