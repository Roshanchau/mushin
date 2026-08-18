import "reflect-metadata";
import { JsonUtils } from "../utils/jsonUtil.js";

export class ObjectSerializer {
  static toLogString(obj: any): string {
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";

    const type = typeof obj;

    if (type === "string") return obj;
    if (type === "number" || type === "boolean" || type === "bigint") {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      return `[${obj.map(o => this.toLogString(o)).join(", ")}]`;
    }

    if (type === "object") {

      try {
        return JsonUtils.toJson(obj);
      } catch {
        try {
          return JSON.stringify(obj);
        } catch {
          return "[Unserializable object]";
        }
      }
    }

    return String(obj);
  }
}
