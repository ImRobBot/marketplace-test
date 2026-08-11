import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response
} from 'express';

import { logger } from '../logger';

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(handler: AsyncRoute): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

export function notFoundHandler(): RequestHandler {
  return (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error({ err: error }, 'Unhandled request error');

  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
