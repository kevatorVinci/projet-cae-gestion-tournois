import { AuthenticatedUser, MaybeAuthenticatedUser } from '../types';

type JwtPayload = {
  exp?: number;
  id?: number;
  userId?: number;
  sub?: string;
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

const decodeJwtPayload = (token: string): JwtPayload | undefined => {
  const [, payload] = token.split('.');

  if (!payload) return undefined;

  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return undefined;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return Date.now() >= payload.exp * 1000;
};

const storeAuthenticatedUser = (
  authenticatedUser: AuthenticatedUser,
  rememberMe = true,
) => {
  if (rememberMe) {
    localStorage.setItem(
      'authenticatedUser',
      JSON.stringify(authenticatedUser),
    );
    sessionStorage.removeItem('authenticatedUser');
    return;
  }

  sessionStorage.setItem(
    'authenticatedUser',
    JSON.stringify(authenticatedUser),
  );
  localStorage.removeItem('authenticatedUser');
};

const getAuthenticatedUser = (): MaybeAuthenticatedUser => {
  const authenticatedUser =
    localStorage.getItem('authenticatedUser') ||
    sessionStorage.getItem('authenticatedUser');

  if (!authenticatedUser) return undefined;

  const user: AuthenticatedUser = JSON.parse(authenticatedUser);

  if (isTokenExpired(user.token)) {
    clearAuthenticatedUser();
    return undefined;
  }

  return user;
};

const clearAuthenticatedUser = () => {
  localStorage.removeItem('authenticatedUser');
  sessionStorage.removeItem('authenticatedUser');
};

export {
  storeAuthenticatedUser,
  getAuthenticatedUser,
  clearAuthenticatedUser,
  isTokenExpired,
  decodeJwtPayload,
};
