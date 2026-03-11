import { getAuthenticatedUser } from '../utils/session';
import { NotificationItem } from '../types';

const API_BASE = '/api/api/notifications';

function getAuthHeaders(): HeadersInit {
  const token = getAuthenticatedUser()?.token;
  return token
    ? {
        Authorization: token,
      }
    : {};
}

async function parseError(response: Response, fallbackMessage: string) {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {
    // Ignore JSON parsing errors and use fallback message.
  }
  return fallbackMessage;
}

export async function getUserNotifications(
  userId: number,
): Promise<NotificationItem[]> {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        'Erreur lors de la recuperation des notifications.',
      ),
    );
  }

  return response.json() as Promise<NotificationItem[]>;
}

export async function getUserUnreadNotifications(
  userId: number,
): Promise<NotificationItem[]> {
  const response = await fetch(`${API_BASE}/users/${userId}/non-lues`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        'Erreur lors de la recuperation des notifications non lues.',
      ),
    );
  }

  return response.json() as Promise<NotificationItem[]>;
}

export async function markNotificationAsRead(
  idNotification: number,
): Promise<NotificationItem> {
  const response = await fetch(`${API_BASE}/${idNotification}/lue`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Erreur lors du marquage de la notification.'),
    );
  }

  return response.json() as Promise<NotificationItem>;
}

export async function markAllNotificationsAsRead(
  userId: number,
): Promise<void> {
  const response = await fetch(`${API_BASE}/users/${userId}/tous-lues`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        'Erreur lors du marquage global des notifications.',
      ),
    );
  }
}
