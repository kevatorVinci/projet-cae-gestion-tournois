import { getAuthenticatedUser } from '../utils/session';
import { DemandeDecisionResult } from '../types';

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

export async function accepterDemande(
  demandeId: number,
): Promise<DemandeDecisionResult> {
  const response = await fetch(`${API_BASE}/demands/${demandeId}/accepter`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, "Impossible d'accepter la demande."),
    );
  }

  return response.json() as Promise<DemandeDecisionResult>;
}

export async function refuserDemande(
  demandeId: number,
  raisonRefus?: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/demands/${demandeId}/refuser`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(raisonRefus ? { raisonRefus } : {}),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, 'Impossible de refuser la demande.'),
    );
  }
}
