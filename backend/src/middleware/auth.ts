import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import type { Models } from '../models';

type AuthModels = Pick<Models, 'User'>;

export function createAuthMiddleware(models: AuthModels): RequestHandler {
  const jwtSecret = process.env.JWT_SECRET || 'secret';

  return async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      res.status(401).json({ error: 'Missing token' });
      return;
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || !parts[1]) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    try {
      const payload = jwt.verify(parts[1], jwtSecret);
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
