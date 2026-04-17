import { getAuthenticatedUser } from '../utils/session';
import { DemandeDecisionResult, DemandePendingItem } from '../types';

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

type RawDemandePendingItem = {
  idDemande?: number;
  id?: number;
  membreId?: number;
  memberId?: number;
  membreEmail?: string;
  memberEmail?: string;
  membreTag?: string;
  memberTag?: string;
  membreSpecialty?: string;
  memberSpecialty?: string;
  membreProfileImageUrl?: string;
  memberProfileImageUrl?: string;
  equipeId?: number;
  teamId?: number;
  equipeName?: string;
  teamName?: string;
  etat?: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
  state?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  dateDemande?: string;
  requestDate?: string;
  dateTraitement?: string;
  processingDate?: string;
  raisonRefus?: string;
  rejectionReason?: string;
};

function mapStateToFrontend(
  state?: RawDemandePendingItem['state'],
): DemandePendingItem['etat'] {
  if (state === 'PENDING') return 'EN_ATTENTE';
  if (state === 'ACCEPTED') return 'ACCEPTEE';
  if (state === 'REJECTED') return 'REFUSEE';
  return undefined;
}

function normalizePendingDemand(
  raw: RawDemandePendingItem,
): DemandePendingItem {
  return {
    idDemande: raw.idDemande ?? raw.id ?? 0,
    membreId: raw.membreId ?? raw.memberId ?? 0,
    membreEmail: raw.membreEmail ?? raw.memberEmail,
    membreTag: raw.membreTag ?? raw.memberTag,
    membreSpecialty: raw.membreSpecialty ?? raw.memberSpecialty,
    membreProfileImageUrl:
      raw.membreProfileImageUrl ?? raw.memberProfileImageUrl,
    equipeId: raw.equipeId ?? raw.teamId ?? 0,
    equipeName: raw.equipeName ?? raw.teamName,
    etat: raw.etat ?? mapStateToFrontend(raw.state),
    dateDemande: raw.dateDemande ?? raw.requestDate,
    dateTraitement: raw.dateTraitement ?? raw.processingDate,
    raisonRefus: raw.raisonRefus ?? raw.rejectionReason,
  };
}

export async function accepterDemande(
  demandeId: number,
): Promise<DemandeDecisionResult | null> {
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

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as DemandeDecisionResult;
  } catch {
    return null;
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
    body: JSON.stringify(raisonRefus ? { rejectionReason: raisonRefus } : {}),
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

  const data = (await response.json()) as RawDemandePendingItem[];
  return data.map(normalizePendingDemand);
}
