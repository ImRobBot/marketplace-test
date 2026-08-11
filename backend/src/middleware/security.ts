import type { RequestHandler } from 'express';

const windowMs = 60_000;
const maxRequests = 100;

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

export function securityHeaders(): RequestHandler {
  return (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    );
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  };
}

export function rateLimit(options: RateLimitOptions = {}): RequestHandler {
  const requestWindowMs = options.windowMs ?? windowMs;
  const requestMax = options.maxRequests ?? maxRequests;
  const requests = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const now = Date.now();
    const clientIp = req.ip ?? 'unknown';
    const current = requests.get(clientIp);
    if (!current || current.resetAt <= now) {
      requests.set(clientIp, { count: 1, resetAt: now + requestWindowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > requestMax) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    next();
  };
}
