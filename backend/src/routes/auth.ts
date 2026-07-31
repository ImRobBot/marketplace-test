import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';

import type { Models } from '../models';

interface AuthRoutesDependencies {
  models: Pick<Models, 'User'>;
}

interface CredentialsBody {
  username?: unknown;
  password?: unknown;
}

export function createAuthRouter({ models }: AuthRoutesDependencies): Router {
  const router = Router();
  const jwtSecret = process.env.JWT_SECRET || 'secret';

  router.post('/register', async (req, res) => {
    const { username, password } = req.body as CredentialsBody;
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const existingUser = await models.User.findOne({ where: { username } });
    if (existingUser) {
      res.status(400).json({ error: 'User exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 8);
    const user = await models.User.create({ username, passwordHash });
    const token = jwt.sign({ sub: user.id, username: user.username }, jwtSecret, {
      expiresIn: '7d'
    });

    res.json({ token, user: { id: user.id, username: user.username } });
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body as CredentialsBody;
    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const user = await models.User.findOne({ where: { username } });
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ sub: user.id, username: user.username }, jwtSecret, {
      expiresIn: '7d'
    });

    res.json({ token, user: { id: user.id, username: user.username } });
  });

  return router;
}
