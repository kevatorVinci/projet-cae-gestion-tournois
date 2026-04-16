import { createContext, useState, ReactNode, useEffect } from 'react';
import {
  MaybeAuthenticatedUser,
  UserContextType,
  User,
  AuthenticatedUser,
} from '../types';

import {
  clearAuthenticatedUser,
  getAuthenticatedUser,
  storeAuthenticatedUser,
  isTokenExpired,
} from '../utils/session';

// 1) Add a default no-op action to avoid breaking the app
const defaultUserContext: UserContextType = {
  authenticatedUser: undefined,
  registerUser: async () => {},
  loginUser: async () => {},
  clearUser: () => {},
  updateUser: () => {},
};

const UserContext = createContext<UserContextType>(defaultUserContext);

const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [authenticatedUser, setAuthenticatedUser] =
    useState<MaybeAuthenticatedUser>(getAuthenticatedUser());

  const registerUser = async (newUser: User) => {
    try {
      const options = {
        method: 'POST',
        body: JSON.stringify(newUser),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await fetch('/api/auths/register', options);

      if (!response.ok)
        throw new Error(
          `Erreur lors de l'inscription : ${response.status} : ${response.statusText}`,
        );

      await response.json();
    } catch (err) {
      console.error('registerUser::error: ', err);
      throw err;
    }
  };

  const loginUser = async (user: User, rememberMe: boolean) => {
    try {
      const options = {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await fetch('/api/auths/login', options);

      if (!response.ok) {
        let errorMessage = 'Identifiants incorrects. Veuillez réessayer.';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Si la réponse n'est pas du JSON, on garde le message par défaut.
        }
        throw new Error(errorMessage);
      }

      const authenticatedUser: AuthenticatedUser = await response.json();

      // Keep the password in context for own-profile display.
      const authenticatedUserWithPassword: AuthenticatedUser = {
        ...authenticatedUser,
        password: user.password,
      };

      setAuthenticatedUser(authenticatedUserWithPassword);
      storeAuthenticatedUser(authenticatedUserWithPassword, rememberMe);
    } catch (err) {
      console.error('loginUser::error: ', err);
      throw err;
    }
  };

  const clearUser = () => {
    clearAuthenticatedUser();
    setAuthenticatedUser(undefined);
  };

  const updateUser = (updatedData: Partial<AuthenticatedUser>) => {
    if (authenticatedUser) {
      // Merge the previous user object with the new fields
      const newUserData = { ...authenticatedUser, ...updatedData };

      setAuthenticatedUser(newUserData);

      const isRemembered = localStorage.getItem('authenticatedUser') !== null;
      storeAuthenticatedUser(newUserData, isRemembered);
    }
  };

  useEffect(() => {
    if (!authenticatedUser?.token) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired(authenticatedUser.token)) {
        clearUser();
        window.location.href = '/login';
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000);
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [authenticatedUser]);

  const myContext: UserContextType = {
    authenticatedUser,
    registerUser,
    loginUser,
    clearUser,
    updateUser,
  };

  return (
    <UserContext.Provider value={myContext}>{children}</UserContext.Provider>
  );
};

export { UserContext, UserContextProvider };
