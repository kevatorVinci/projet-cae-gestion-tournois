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
 * Authentication service - Registration
 * @param {Object} credentials - User registration payload
 * @return {Promise<Object>} An object containing the user and token
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
 * Authentication service - Login
 * @param {Object} credentials - Login credentials
 * @return {Promise<Object>} An object containing the user and token
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
 * Registration service used by the Register page.
 * Returns the HTTP status so the component can handle UX messages.
 * @param {RegisterPayload} payload - Registration form data.
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
