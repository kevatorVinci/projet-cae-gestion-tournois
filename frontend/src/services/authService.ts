import { AuthenticatedUser } from '../types';

async function parseError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {
    // Ignore parsing errors and use fallback.
  }
  return fallback;
}

export async function fetchAllUsers(
  token: string,
): Promise<AuthenticatedUser[]> {
  const response = await fetch('/api/auths/users', {
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Impossible de charger les joueurs.'),
    );
  }

  return response.json() as Promise<AuthenticatedUser[]>;
}

export async function toggleAdminRole(
  email: string,
  isCurrentlyAdmin: boolean,
  token: string,
): Promise<void> {
  const url = isCurrentlyAdmin
    ? '/api/auths/removeAdmin'
    : '/api/auths/addAdmin';

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        'Erreur lors de la modification. Vérifiez le serveur Java.',
      ),
    );
  }
}

export async function banUser(
  email: string,
  token: string,
  reason?: string,
): Promise<void> {
  const response = await fetch('/api/auths/ban', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ email, reason: reason || undefined }),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Erreur lors du bannissement sur le serveur.'),
    );
  }
}
