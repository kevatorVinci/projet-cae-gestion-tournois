export interface Equipe {
  id: number;
  name: string;
  responsable?: User;
  members: User[];
  isResponsable?: boolean;
}

interface User {
  id?: number;
  email?: string;
  password?: string;
  tag?: string;
  isResponsable?: boolean;
  specialty?: string;
  profileImageUrl?: string;
  team?: string | null;
  creationDate?: string;
  dateCreationProfil?: string;
  admin?: boolean;
  equipe?: Equipe | null;

  // Compatibility aliases used in some existing components.
  profileImage?: string;
}

interface NotificationItem {
  idNotification: number;
  message: string;
  dateEnvoi: string;
  estLue: boolean;
}

interface DemandeDecisionResult {
  id?: number;
  tag?: string;
  specialty?: string;
  profileImageUrl?: string;
}

interface DemandePendingItem {
  idDemande: number;
  membreId: number;
  membreEmail?: string;
  membreTag?: string;
  membreSpecialty?: string;
  membreProfileImageUrl?: string;
  equipeId: number;
  equipeName?: string;
  etat?: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
  dateDemande?: string;
  dateTraitement?: string;
  raisonRefus?: string;
}

interface AuthenticatedUser {
  email: string;
  token: string;
  password?: string;
  tag?: string;
  specialty?: string;
  profileImage?: string;
  admin?: boolean;
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
  NotificationItem,
  DemandeDecisionResult,
  DemandePendingItem,
};
