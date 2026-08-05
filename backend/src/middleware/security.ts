import type { RequestHandler } from 'express';

const windowMs = 60_000;
const maxRequests = 100;
const requests = new Map<string, { count: number; resetAt: number }>();

export function securityHeaders(): RequestHandler {
  return (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  };
}

export function rateLimit(): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const clientIp = req.ip ?? 'unknown';
    const current = requests.get(clientIp);
    if (!current || current.resetAt <= now) {
      requests.set(clientIp, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    next();
  };
}
