import type { CookieOptions, Request, Response } from 'express';

const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export function sessionCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Host-mercado_session'
    : 'mercado_session';
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionLifetimeMs
  };
}

export function setSessionCookie(response: Response, token: string): void {
  response.cookie(sessionCookieName(), token, cookieOptions());
}

export function clearSessionCookie(response: Response): void {
  const { maxAge: _maxAge, ...clearOptions } = cookieOptions();
  response.clearCookie(sessionCookieName(), clearOptions);
}

export function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== sessionCookieName()) continue;

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}
