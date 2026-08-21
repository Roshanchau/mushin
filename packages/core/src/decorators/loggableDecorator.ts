import { LoggerService } from "../services";
import { ObjectSerializer } from "../services";

export function Loggable(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== "function") {
      throw new TypeError(
        "@Loggable can only be applied to methods."
      );
    }

    const className = target.constructor.name;
    const methodName = propertyKey.toString();

    descriptor.value = async function (...args: unknown[]) {
      const argString = ObjectSerializer.toLogString(args);

      LoggerService.info(
        `${className}.${methodName} | entry | args: ${argString}`
      );

      const start = Date.now();

      try {
        const result = await originalMethod.apply(this, args);

        const resultString =
          ObjectSerializer.toLogString(result);

        const timeTaken = Date.now() - start;

        LoggerService.info(
          `${className}.${methodName} | exit | response: ${resultString} | timeTaken: ${timeTaken}ms`
        );

        return result;
      } catch (error: unknown) {
        const timeTaken = Date.now() - start;

        const errorMessage =
          error instanceof Error
            ? error.message
            : String(error);

        LoggerService.error(
          `${className}.${methodName} | error: ${errorMessage} | timeTaken: ${timeTaken}ms`
        );

        throw error;
      }
    };

    return descriptor;
  };
}