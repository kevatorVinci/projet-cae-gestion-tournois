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

interface PizzeriaContext {
  pizzas: Pizza[];
  setPizzas: (pizzas: Pizza[]) => void;
  actionToBePerformed: boolean;
  setActionToBePerformed: (actionToBePerformed: boolean) => void;
  clearActionToBePerformed: () => void;
  drinks: Drink[];
  addPizza: (newPizza: NewPizza) => Promise<void>;
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
  Pizza,
  NewPizza,
  Drink,
  PizzeriaContext,
  User,
  AuthenticatedUser,
  MaybeAuthenticatedUser,
  UserContextType,
};
