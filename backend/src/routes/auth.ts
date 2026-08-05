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
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }

  router.post('/register', async (req, res) => {
    const { username, password } = req.body as CredentialsBody;
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_.-]{3,64}$/.test(username)) {
      res.status(400).json({ error: 'Invalid username' });
      return;
    }

    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 12 and 128 characters' });
      return;
    }

    const normalizedUsername = username.toLowerCase();
    const existingUser = await models.User.findOne({ where: { username: normalizedUsername } });
    if (existingUser) {
      res.status(400).json({ error: 'User exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 8);
    const user = await models.User.create({ username: normalizedUsername, passwordHash });
    const token = jwt.sign({ sub: user.id, username: user.username }, jwtSecret, {
      expiresIn: '7d'
    });

    res.json({ token, user: { id: user.id, username: user.username } });
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body as CredentialsBody;
    if (typeof username !== 'string' || typeof password !== 'string' || username.length > 64 || password.length > 128) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const user = await models.User.findOne({ where: { username: username.toLowerCase() } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ sub: user.id, username: user.username }, jwtSecret, {
      expiresIn: '7d'
    });

    res.json({ token, user: { id: user.id, username: user.username } });
  });

  return router;
}
