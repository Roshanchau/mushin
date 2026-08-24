import { Loggable, LoggerLevel , LoggerService } from "@mushinn/core";

import {WinstonAdapter} from "@mushinn/winston"

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