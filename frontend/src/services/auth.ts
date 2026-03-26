import { AuthenticatedUser } from '../types';

type RegisterPayload = {
  email: string;
  password: string;
  tag: string;
  specialty: string;
  profileImage: string;
  team: string | null;
};

type RegisterResult =
  | { ok: true; status: number; authenticatedUser: AuthenticatedUser }
  | { ok: false; status: number };

/**
 * Service d'authentification - Registration
 * @param {Object} credentials - Les données d'inscription de l'utilisateur
 * @return {Promise<Object>} Un objet contenant l'utilisateur et son token
 */
export async function register(credentials: {
  email: string;
  [key: string]: unknown;
}) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
}

/**
 * Service d'authentification - Login
 * @param {Object} credentials - Les identifiants de connexion
 * @return {Promise<Object>} Un objet contenant l'utilisateur et son token
 */
export async function login(credentials: {
  email: string;
  [key: string]: unknown;
}) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

/**
 * Service d'inscription utilisé par la page Register.
 * Retourne le statut HTTP pour laisser le composant gérer les messages UX.
 * @param {RegisterPayload} payload - Données du formulaire d'inscription.
 */
export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResult> {
  const response = await fetch('/api/auths/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  const authenticatedUser = (await response.json()) as AuthenticatedUser;
  return { ok: true, status: response.status, authenticatedUser };
}
