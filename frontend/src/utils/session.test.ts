import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuthenticatedUser,
  decodeJwtPayload,
  getAuthenticatedUser,
  isTokenExpired,
  storeAuthenticatedUser,
} from './session';

function toBase64Url(value: string): string {
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function makeJwt(payload: Record<string, unknown>): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `header.${encodedPayload}.signature`;
}

describe('session utils', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('decodeJwtPayload retourne undefined pour un token invalide', () => {
    expect(decodeJwtPayload('invalid')).toBeUndefined();
  });

  it('decodeJwtPayload retourne le contenu du payload', () => {
    const token = makeJwt({ id: 7, exp: 4102444800 });
    expect(decodeJwtPayload(token)).toEqual({ id: 7, exp: 4102444800 });
  });

  it('isTokenExpired retourne true si le payload n a pas de exp', () => {
    const token = makeJwt({ id: 1 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('isTokenExpired retourne false pour un token non expire', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const token = makeJwt({ exp: 1700000001 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('isTokenExpired retourne true pour un token expire', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const token = makeJwt({ exp: 1699999999 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('storeAuthenticatedUser stocke en localStorage si rememberMe=true', () => {
    const user = {
      email: 'a@vinci.be',
      token: makeJwt({ exp: 4102444800 }),
      admin: false,
    };

    storeAuthenticatedUser(user, true);

    expect(localStorage.getItem('authenticatedUser')).toContain('a@vinci.be');
    expect(sessionStorage.getItem('authenticatedUser')).toBeNull();
  });

  it('storeAuthenticatedUser stocke en sessionStorage si rememberMe=false', () => {
    const user = {
      email: 'b@vinci.be',
      token: makeJwt({ exp: 4102444800 }),
      admin: true,
    };

    storeAuthenticatedUser(user, false);

    expect(sessionStorage.getItem('authenticatedUser')).toContain('b@vinci.be');
    expect(localStorage.getItem('authenticatedUser')).toBeNull();
  });

  it('getAuthenticatedUser retourne undefined quand rien n est stocke', () => {
    expect(getAuthenticatedUser()).toBeUndefined();
  });

  it('getAuthenticatedUser retourne l utilisateur quand le token est valide', () => {
    const user = {
      email: 'ok@vinci.be',
      token: makeJwt({ exp: 4102444800 }),
      admin: false,
    };
    localStorage.setItem('authenticatedUser', JSON.stringify(user));

    expect(getAuthenticatedUser()).toEqual(user);
  });

  it('getAuthenticatedUser nettoie et retourne undefined quand le token est expire', () => {
    const user = {
      email: 'expired@vinci.be',
      token: makeJwt({ exp: 1000 }),
      admin: false,
    };
    localStorage.setItem('authenticatedUser', JSON.stringify(user));
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    expect(getAuthenticatedUser()).toBeUndefined();
    expect(localStorage.getItem('authenticatedUser')).toBeNull();
    expect(sessionStorage.getItem('authenticatedUser')).toBeNull();
  });

  it('clearAuthenticatedUser supprime localStorage et sessionStorage', () => {
    localStorage.setItem('authenticatedUser', 'x');
    sessionStorage.setItem('authenticatedUser', 'y');

    clearAuthenticatedUser();

    expect(localStorage.getItem('authenticatedUser')).toBeNull();
    expect(sessionStorage.getItem('authenticatedUser')).toBeNull();
  });
});
