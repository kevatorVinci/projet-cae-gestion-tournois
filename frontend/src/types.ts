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
  password?: string;
  tag?: string;
  specialty?: string;
  profileImage?: string;
  team?: string | null;
}

interface AuthenticatedUser {
  email: string;
  token: string;
  // On ajoute les nouveautés dont ton profil a besoin !
  tag?: string;
  specialty?: string;
  profileImage?: string;
}

type MaybeAuthenticatedUser = AuthenticatedUser | undefined;

interface UserContextType {
  authenticatedUser: MaybeAuthenticatedUser;
  registerUser: (newUser: User) => Promise<void>;

  loginUser: (user: User, rememberMe: boolean) => Promise<void>;
  clearUser: () => void;
  updateUser: (updatedData: Partial<AuthenticatedUser>) => void;
}

// On n'exporte plus les pizzas !
export type {
  User,
  AuthenticatedUser,
  MaybeAuthenticatedUser,
  UserContextType,
};
