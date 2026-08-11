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
  const statusCode = typeof error === 'object' && error !== null && 'status' in error
    && typeof error.status === 'number'
    ? error.status
    : 500;
  const errorName = error instanceof Error ? error.name : 'UnknownError';

  logger.error({ errorName, statusCode }, 'Unhandled request error');

  if (statusCode === 413) {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
