<<<<<<< HEAD
// import { AuthenticatedUser, MaybeAuthenticatedUser } from '../types';
=======
import { AuthenticatedUser } from '../types';
>>>>>>> origin/develop

// const storeAuthenticatedUser = (authenticatedUser: AuthenticatedUser) => {
//   localStorage.setItem('authenticatedUser', JSON.stringify(authenticatedUser));
// };

<<<<<<< HEAD
// const getAuthenticatedUser = (): MaybeAuthenticatedUser => {
//   const authenticatedUser = localStorage.getItem('authenticatedUser');

//   if (!authenticatedUser) return undefined;

//   return JSON.parse(authenticatedUser);
// };

// const clearAuthenticatedUser = () => {
//   localStorage.removeItem('authenticatedUser');
// };

// export { storeAuthenticatedUser, getAuthenticatedUser, clearAuthenticatedUser };
=======
const clearAuthenticatedUser = () => {
  localStorage.removeItem('authenticatedUser');
};

export { storeAuthenticatedUser, clearAuthenticatedUser };
>>>>>>> origin/develop
