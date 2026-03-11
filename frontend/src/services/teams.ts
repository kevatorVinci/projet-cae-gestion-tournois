import { getAuthenticatedUser } from '../utils/session';
import { Equipe, User } from '../types';

type BackendMembre = {
  id: number;
  tag: string;
  specialty?: string;
  profileImageUrl?: string;
};

type BackendEquipe = {
  id: number;
  name: string;
  membres: BackendMembre[];
  isResponsable: boolean;
};

const API_BASE = '/api';

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

function mapEquipe(dto: BackendEquipe): Equipe {
  const members: User[] = (dto.membres ?? []).map((member) => ({
    id: member.id,
    tag: member.tag,
    specialty: member.specialty,
    profileImageUrl: member.profileImageUrl,
    profileImage: member.profileImageUrl,
  }));

  return {
    id: dto.id,
    name: dto.name,
    members,
    responsable: undefined,
    isResponsable: dto.isResponsable,
  };
}

function resolveUserId(userId?: number): number {
  if (typeof userId === 'number') {
    return userId;
  }

  const token = getAuthenticatedUser()?.token;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as {
        id?: number;
        userId?: number;
        sub?: string;
      };

      if (typeof payload.id === 'number') {
        return payload.id;
      }
      if (typeof payload.userId === 'number') {
        return payload.userId;
      }
      const subAsNumber = Number(payload.sub);
      if (!Number.isNaN(subAsNumber) && Number.isFinite(subAsNumber)) {
        return subAsNumber;
      }
    } catch {
      // Ignore malformed token payload and fallback below.
    }
  }

  return 1;
}

export async function getAllEquipes(): Promise<Equipe[]> {
  const response = await fetch(`${API_BASE}/equipes`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Erreur lors de la recuperation des equipes'),
    );
  }
  const data = (await response.json()) as BackendEquipe[];
  return data.map(mapEquipe);
}

export async function getEquipeById(id: string | number): Promise<Equipe> {
  const response = await fetch(`${API_BASE}/equipes/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Impossible de trouver cette equipe'),
    );
  }
  const data = (await response.json()) as BackendEquipe;
  return mapEquipe(data);
}

export async function createEquipe(
  name: string,
  userId?: number,
): Promise<Equipe> {
  const resolvedUserId = resolveUserId(userId);

  const response = await fetch(
    `${API_BASE}/equipes/${resolvedUserId}/equipes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ name }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Erreur lors de la creation de l'equipe"),
    );
  }

  const data = (await response.json()) as { id: number; name: string };
  return {
    id: data.id,
    name: data.name,
    members: [],
  };
}

export async function isCurrentUserResponsable(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/equipes/me/isResponsable`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) return false;
  return response.json() as Promise<boolean>;
}

export async function joinEquipe(
  teamId: number,
  userId?: number,
): Promise<void> {
  const resolvedUserId = resolveUserId(userId);

  const response = await fetch(
    `${API_BASE}/equipes/${resolvedUserId}/equipes/rejoindre`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ equipeId: teamId }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Impossible de rejoindre cette equipe.'),
    );
  }
}

export async function leaveEquipe(
  userId?: number,
  nouveauResponsableId?: number,
): Promise<void> {
  const resolvedUserId = resolveUserId(userId);

  const response = await fetch(
    `${API_BASE}/equipes/${resolvedUserId}/equipes/quitter`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(
        nouveauResponsableId ? { nouveauResponsableId } : {},
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Impossible de quitter l'equipe."),
    );
  }
}
