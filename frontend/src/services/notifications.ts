import { NotificationItem } from '../types';
import { getAuthenticatedUser, decodeJwtPayload } from '../utils/session';

const API_BASE = '/api/notifications';

function getRequiredAuthToken(): string {
  const token = getAuthenticatedUser()?.token;
  if (!token) {
    throw new Error('Session expiree. Veuillez vous reconnecter.');
  }
  return token;
}

export function getCurrentUserIdFromToken(): number {
  const token = getRequiredAuthToken();
  const payload = decodeJwtPayload(token);
  const maybeId = payload?.id ?? payload?.userId;

  if (!maybeId) {
    throw new Error('Impossible de recuperer l utilisateur connecte.');
  }

  return Number(maybeId);
}

async function parseError(response: Response, fallbackMessage: string) {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {
    // Ignore parsing errors and use fallback message.
  }
  return fallbackMessage;
}

export async function getNotificationsByUser(
  userId: number,
): Promise<NotificationItem[]> {
  const token = getRequiredAuthToken();
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Impossible de recuperer les notifications.'),
    );
  }

  return response.json() as Promise<NotificationItem[]>;
}

export async function getUnreadNotificationsByUser(
  userId: number,
): Promise<NotificationItem[]> {
  const token = getRequiredAuthToken();
  const response = await fetch(`${API_BASE}/users/${userId}/non-lues`, {
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        'Impossible de recuperer les notifications non lues.',
      ),
    );
  }

  return response.json() as Promise<NotificationItem[]>;
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<void> {
  const token = getRequiredAuthToken();
  const response = await fetch(`${API_BASE}/${notificationId}/lue`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        'Impossible de marquer la notification comme lue.',
      ),
    );
  }
}

export async function markAllNotificationsAsRead(
  userId: number,
): Promise<void> {
  const token = getRequiredAuthToken();
  const response = await fetch(`${API_BASE}/users/${userId}/tous-lues`, {
    method: 'PATCH',
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        'Impossible de marquer toutes les notifications comme lues.',
      ),
    );
  }
}
