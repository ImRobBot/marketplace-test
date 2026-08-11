import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { readSessionCookie } from '../auth/session';
import type { Models } from '../models';

type AuthModels = Pick<Models, 'User'>;

export function createAuthMiddleware(models: AuthModels): RequestHandler {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }

  return async (req, res, next) => {
    const authorization = req.headers.authorization;
    const cookieToken = readSessionCookie(req);
    let token: string | null = null;
    let usesCookie = false;

    if (authorization) {
      const parts = authorization.split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      token = parts[1];
    } else if (cookieToken) {
      token = cookieToken;
      usesCookie = true;
    }

    if (!token) {
      res.status(401).json({ error: 'Missing token' });
      return;
    }

    if (usesCookie && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
      if (req.headers.origin !== allowedOrigin) {
        res.status(403).json({ error: 'Invalid request origin' });
        return;
      }
    }

    try {
      const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || payload.sub == null) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const user = await models.User.findByPk(payload.sub);
      if (!user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      req.user = { id: user.id, username: user.username };
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
