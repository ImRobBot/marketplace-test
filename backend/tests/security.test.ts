import type { NextFunction, Request, Response } from 'express';

import { rateLimit, securityHeaders } from '../src/middleware/security';

describe('security middleware', () => {
  it('adds defensive response headers and delegates', () => {
    const middleware = securityHeaders();
    const setHeader = jest.fn();
    const next = jest.fn() as NextFunction;
    const response = { setHeader } as unknown as Response;

    middleware({} as Request, response, next);

    expect(setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
    expect(setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('limits repeated requests from the same client', () => {
    const middleware = rateLimit();
    const next = jest.fn() as NextFunction;
    const setHeader = jest.fn();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const response = { setHeader, status, json } as unknown as Response;
    const request = { ip: `test-client-${Date.now()}-${Math.random()}` } as Request;

    for (let index = 0; index < 100; index += 1) {
      middleware(request, response, next);
    }
    middleware(request, response, next);

    expect(next).toHaveBeenCalledTimes(100);
    expect(status).toHaveBeenCalledWith(429);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
    expect(json).toHaveBeenCalledWith({ error: 'Too many requests' });
  });

  it('supports stricter limits for sensitive route groups', () => {
    const middleware = rateLimit({ maxRequests: 1 });
    const next = jest.fn() as NextFunction;
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    const request = { ip: `sensitive-client-${Date.now()}-${Math.random()}` } as Request;

    middleware(request, response, next);
    middleware(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(429);
  });
});
