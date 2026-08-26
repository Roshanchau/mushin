import { Request, Response, NextFunction } from "express";
import { v7 as uuid } from "uuid";
import { AsyncContextService } from "../services";

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  AsyncContextService.runWithNewContext(() => {
    AsyncContextService.setThreadId(uuid());
    next();
  });
}

