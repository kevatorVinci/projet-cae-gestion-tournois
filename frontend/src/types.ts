export interface Equipe {
  id: number;
  name: string;
}
export interface Membre {
  id: number;
  tag: string;
  role: 'RESPONSABLE' | 'MEMBRE';
  specialty: string;
  avatarSeed: string;
}

export interface MyTeamData extends Equipe {
  wins: number;
  members: Membre[];
}

interface UserContextType {
  authenticatedUser: MaybeAuthenticatedUser;
  registerUser: (newUser: User) => Promise<void>;
  loginUser: (user: User) => Promise<void>;
  clearUser: () => void;
}

interface User {
  email: string;
  password: string;
}

interface AuthenticatedUser {
  email: string;
  token: string;
}

type MaybeAuthenticatedUser = AuthenticatedUser | undefined;

export type {
  User,
  AuthenticatedUser,
  MaybeAuthenticatedUser,
  UserContextType,
};
