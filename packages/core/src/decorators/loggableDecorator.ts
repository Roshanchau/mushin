import { LoggerService } from "../services";
import { ObjectSerializer } from "../services";

export function Loggable(): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    if (typeof originalMethod !== "function") {
      throw new TypeError("@Loggable() can only be applied to methods.");
    }

    const className =
      typeof target === "function" ? target.name : target.constructor.name;
    const methodName = String(propertyKey);
    const isAsync = originalMethod.constructor.name === "AsyncFunction";

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const startTime = Date.now();
      LoggerService.info(`${className}.${methodName} | entry`, {
        arguments: ObjectSerializer.toLogString(args),
      });

      const logExit = (result: unknown) => {
        LoggerService.info(`${className}.${methodName} | exit`, {
          response: ObjectSerializer.toLogString(result),
          timeTaken: `${Date.now() - startTime}ms`,
        });
        return result;
      };

      const logError = (error: unknown) => {
        LoggerService.error(
          `${className}.${methodName} | error`,
          { timeTaken: `${Date.now() - startTime}ms` },
          error
        );
        throw error;
      };

      if (isAsync) {
        return (originalMethod.apply(this, args) as Promise<unknown>).then(
          logExit,
          logError
        );
      }
      try {
        return logExit(originalMethod.apply(this, args));
      } catch (error) {
        logError(error);
      }
    };

    return descriptor;
  };
}