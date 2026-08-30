import { LoggerLevel } from "../enums/logLevel";
export interface LogEntry {
  level: LoggerLevel;
  message: string;
  timestamp: string;
  threadId:string;
  userId:string;
  error?: unknown;
  traceId?: string;
  spanId?: string;
  eventName?: string;
}