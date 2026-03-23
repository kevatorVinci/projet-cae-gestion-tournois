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
