import { AuthenticatedUser, MaybeAuthenticatedUser } from '../types';

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

  return JSON.parse(authenticatedUser);
};

const clearAuthenticatedUser = () => {
  localStorage.removeItem('authenticatedUser');
  sessionStorage.removeItem('authenticatedUser');
};

export { storeAuthenticatedUser, getAuthenticatedUser, clearAuthenticatedUser };
