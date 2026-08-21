import { Loggable } from "@muchin/core";

import { LoggerService, LoggerLevel } from "@muchin/core";
import { WinstonAdapter } from "@muchin/winston";

LoggerService.configure(
  new WinstonAdapter({
    level: LoggerLevel.INFO,
    logDirectory: "./logs"
  })
);

class UserService {
  @Loggable()
   getUser() {
    return {
      id: "123"
    };
  }
}

const user = new UserService();

console.log( user.getUser());