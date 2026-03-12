import { getAuthenticatedUser } from '../utils/session';
import { DemandePendingItem } from '../types';

const API_BASE = '/api';

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
  return fallbackMessage;
}

export async function accepterDemande(demandeId: number): Promise<void> {
  const token = getRequiredAuthToken();
  const response = await fetch(`${API_BASE}/demands/${demandeId}/accepter`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Impossible d'accepter la demande."),
    );
  }
}

export async function refuserDemande(
  demandeId: number,
  raisonRefus?: string,
): Promise<void> {
  const token = getRequiredAuthToken();
  const response = await fetch(`${API_BASE}/demands/${demandeId}/refuser`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(raisonRefus ? { raisonRefus } : {}),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Impossible de refuser la demande.'),
    );
  }
}

export async function getDemandesEnAttenteResponsable(): Promise<
  DemandePendingItem[]
> {
  const token = getRequiredAuthToken();
  const response = await fetch(`${API_BASE}/demands/me/en-attente`, {
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        'Impossible de recuperer les demandes en attente.',
      ),
    );
  }

  return response.json() as Promise<DemandePendingItem[]>;
}
