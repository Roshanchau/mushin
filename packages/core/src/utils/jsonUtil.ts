import { plainToInstance, instanceToPlain } from "class-transformer";


export class JsonUtils {
  /**
   * Converts a JSON string into a class instance.
   */
  static fromJson<T>(json: string, cls: new () => T): T {
    const plain = JSON.parse(json);
    return plainToInstance(cls, plain, { excludeExtraneousValues: true });
  }

  /**
   * Converts a class instance into a plain object.
   */
  static toPlain<T>(obj: T): object {
    return instanceToPlain(obj);
  }

  /**
   * Converts a class instance into a JSON string.
   */
  static toJson<T>(obj: T): string {
    return JSON.stringify(this.toPlain(obj));
  }

}
