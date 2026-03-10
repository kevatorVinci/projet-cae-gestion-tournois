interface User {
  email: string;
  password?: string;
  tag?: string;
  specialty?: string;
  profileImage?: string;
  team?: string | null;
}

interface AuthenticatedUser {
  email: string;
  token: string;
  tag?: string;
  specialty?: string;
  profileImage?: string;
  admin: boolean;
}

type MaybeAuthenticatedUser = AuthenticatedUser | undefined;

interface UserContextType {
  authenticatedUser: MaybeAuthenticatedUser;
  registerUser: (newUser: User) => Promise<void>;

  loginUser: (user: User, rememberMe: boolean) => Promise<void>;
  clearUser: () => void;
  updateUser: (updatedData: Partial<AuthenticatedUser>) => void;
}

export type {
  User,
  AuthenticatedUser,
  MaybeAuthenticatedUser,
  UserContextType,
};
