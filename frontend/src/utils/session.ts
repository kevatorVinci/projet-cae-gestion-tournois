import { AuthenticatedUser, MaybeAuthenticatedUser } from '../types';

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch (e) {
    return true;
  }
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
};
