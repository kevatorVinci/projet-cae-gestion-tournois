import { AuthenticatedUser } from '../types';

const storeAuthenticatedUser = (authenticatedUser: AuthenticatedUser) => {
  localStorage.setItem('authenticatedUser', JSON.stringify(authenticatedUser));
};

const clearAuthenticatedUser = () => {
  localStorage.removeItem('authenticatedUser');
};

export { storeAuthenticatedUser, clearAuthenticatedUser };
