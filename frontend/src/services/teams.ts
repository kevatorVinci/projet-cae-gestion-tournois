import { decodeJwtPayload, getAuthenticatedUser } from '../utils/session';
import { Equipe, User } from '../types';

type BackendMembre = {
  id: number;
  tag: string;
  isResponsable?: boolean;
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

function getRequiredAuthToken(): string {
  const token = getAuthenticatedUser()?.token;
  if (!token) {
    throw new Error('Session expiree. Veuillez vous reconnecter.');
  }
  return token;
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
  return `${fallbackMessage} (HTTP ${response.status})`;
}

function mapEquipe(dto: BackendEquipe): Equipe {
  const members: User[] = (dto.membres ?? []).map((member) => ({
    id: member.id,
    tag: member.tag,
    isResponsable: member.isResponsable,
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
    const payload = decodeJwtPayload(token);

    if (typeof payload?.id === 'number') {
      return payload.id;
    }
    if (typeof payload?.userId === 'number') {
      return payload.userId;
    }

    const subAsNumber = Number(payload?.sub);
    if (!Number.isNaN(subAsNumber) && Number.isFinite(subAsNumber)) {
      return subAsNumber;
    }
  }

  throw new Error('Utilisateur non authentifie. Veuillez vous reconnecter.');
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
  const token = getRequiredAuthToken();
  const resolvedUserId = resolveUserId(userId);

  const response = await fetch(
    `${API_BASE}/equipes/${resolvedUserId}/equipes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
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
  const token = getRequiredAuthToken();
  const resolvedUserId = resolveUserId(userId);

  const response = await fetch(
    `${API_BASE}/equipes/${resolvedUserId}/equipes/rejoindre`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
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
  const token = getRequiredAuthToken();
  const resolvedUserId = resolveUserId(userId);

  const response = await fetch(
    `${API_BASE}/equipes/${resolvedUserId}/equipes/quitter`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
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

export async function promoteResponsable(membreId: number): Promise<void> {
  const token = getRequiredAuthToken();
  const resolvedUserId = resolveUserId();

  const response = await fetch(
    `${API_BASE}/equipes/${resolvedUserId}/equipes/responsables/${membreId}/promouvoir`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Votre session a expire. Reconnectez-vous pour nommer un responsable.",
      );
    }
    throw new Error(
      await parseError(response, 'Impossible de nommer ce membre responsable.'),
    );
  }
}

export async function depromoteResponsable(membreId: number): Promise<void> {
  const token = getRequiredAuthToken();
  const resolvedUserId = resolveUserId();

  const response = await fetch(
    `${API_BASE}/equipes/${resolvedUserId}/equipes/responsables/${membreId}/depromouvoir`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Impossible de retirer le role responsable.'),
    );
  }
}

export async function getUserTeam(): Promise<Equipe | null> {
  try {
    const userId = resolveUserId();
    const equipes = await getAllEquipes();

    for (const equipe of equipes) {
      if (equipe.members.some((member) => member.id === userId)) {
        return equipe;
      }
    }

    return null;
  } catch {
    return null;
  }
}
