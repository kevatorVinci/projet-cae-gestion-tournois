/**
 * Interface representing the data needed to create a new tournament.
 * This defines the shape of the "package" we send to the backend.
 */
export interface NewTournamentPayload {
  nom: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  dateLimiteInscription: string;
  nombresParticipantsMax: number;
}

export interface TeamRegistrationTournament {
  id: number;
  nom: string;
  etat: string;
  dateDebut: string;
  nombresParticipantsMax?: number;
}

export interface TeamRegistrationItem {
  tournoiId: number;
  equipeId: number;
  dateInscription?: string;
  tournoi: TeamRegistrationTournament;
}

export interface AcceptedTournamentRegistration {
  equipeId: number;
  equipeName: string;
  equipeProfileImage?: string;
  dateInscription?: string;
}

export interface MatchTeam {
  id: number;
  name: string;
  profileImage?: string;
}

export interface TeamMatch {
  id: number;
  tournament: {
    id: number;
    nom: string;
    etat: string;
  };
  equipe1: MatchTeam;
  equipe2: MatchTeam;
  dateMatch?: string;
  scoreEquipe1: number;
  scoreEquipe2: number;
  vainqueur?: MatchTeam | null;
  statut: string;
  tourNumero?: number;
}

// ═══════════════════════════════════════════════════════════════════
// 1. TOURNAMENT MANAGEMENT (PUBLIC AND ADMIN)
// ═══════════════════════════════════════════════════════════════════

export const fetchPublicTournaments = async (etat?: string, nom?: string) => {
  const params = new URLSearchParams();
  if (etat && etat !== 'TOUS') params.append('etat', etat);
  if (nom) params.append('nom', nom);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/tournois/${queryString}`);

  if (!response.ok) {
    throw new Error('Impossible de charger la liste des tournois.');
  }
  return await response.json();
};

export const fetchAllTournaments = async (token: string) => {
  const requestOptions = {
    method: 'GET',
    headers: { Authorization: token },
  };
  const response = await fetch('/api/tournois/all', requestOptions);
  if (!response.ok) {
    throw new Error('Accès refusé. Vous devez être administrateur.');
  }
  return await response.json();
};

export const fetchTournamentById = async (id: string | number) => {
  const response = await fetch(`/api/tournois/${id}`);
  if (!response.ok) {
    throw new Error('Tournoi introuvable.');
  }
  return await response.json();
};

export const createTournament = async (
  payload: NewTournamentPayload,
  token: string,
) => {
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json', Authorization: token },
  };
  const response = await fetch('/api/tournois/', requestOptions);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'Erreur lors de la création (nom déjà pris ?).',
    );
  }
  return await response.json();
};

export const updateTournament = async (
  id: string | number,
  payload: NewTournamentPayload,
  token: string,
) => {
  const requestOptions = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify(payload),
  };
  const response = await fetch(`/api/tournois/${id}`, requestOptions);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Impossible de modifier ce tournoi.');
  }
  return await response.json();
};

// ═══════════════════════════════════════════════════════════════════
// 2. TOURNAMENT LIFECYCLE (ADMIN ONLY)
// ═══════════════════════════════════════════════════════════════════

// Generic function for all status actions (PATCH)
const changeTournamentState = async (
  id: string | number,
  action: string,
  token: string,
  body?: unknown,
) => {
  const requestOptions = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: body ? JSON.stringify(body) : undefined,
  };
  const response = await fetch(`/api/tournois/${id}/${action}`, requestOptions);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Action "${action}" refusée par le serveur.`,
    );
  }
  return await response.json();
};

export const publishTournament = (id: string | number, token: string) =>
  changeTournamentState(id, 'publish', token);
export const closeRegistrations = (id: string | number, token: string) =>
  changeTournamentState(id, 'close-registrations', token);
export const startTournament = (id: string | number, token: string) =>
  changeTournamentState(id, 'start', token);
export const finishTournament = (id: string | number, token: string) =>
  changeTournamentState(id, 'finish', token);
export const cancelTournament = (id: string | number, token: string) =>
  changeTournamentState(id, 'cancel', token);

export const cancelTournamentWithReason = (
  id: string | number,
  token: string,
  reason: string,
) => changeTournamentState(id, 'cancel', token, { reason });

// ═══════════════════════════════════════════════════════════════════
// 3. REGISTRATIONS (TEAMS AND RESPONSIBLES)
// ═══════════════════════════════════════════════════════════════════

// /**
//  * Gets registrations for one tournament (admin)
//  */
export const fetchTournamentRegistrations = async (
  tournoiId: string | number,
  token: string,
) => {
  const response = await fetch(`/api/tournois/${tournoiId}/inscriptions`, {
    headers: { Authorization: token },
  });
  if (!response.ok) throw new Error('Impossible de charger les inscriptions.');
  return await response.json();
};

export const fetchAcceptedTournamentRegistrations = async (
  tournoiId: string | number,
): Promise<AcceptedTournamentRegistration[]> => {
  const response = await fetch(
    `/api/tournois/${tournoiId}/inscriptions/accepted`,
  );
  if (!response.ok) {
    return [];
  }
  return await response.json();
};

export const fetchTeamRegistrations = async (
  equipeId: string | number,
  token: string,
): Promise<TeamRegistrationItem[]> => {
  const response = await fetch(
    `/api/tournois/equipes/${equipeId}/inscriptions`,
    {
      headers: { Authorization: token },
    },
  );
  if (!response.ok)
    throw new Error("Impossible de charger l'historique de l'équipe.");
  return await response.json();
};

export const fetchTeamRegistrationsPublic = async (
  equipeId: string | number,
): Promise<TeamRegistrationItem[]> => {
  const response = await fetch(
    `/api/tournois/equipes/${equipeId}/inscriptions/public`,
  );
  if (!response.ok)
    throw new Error("Impossible de charger l'historique de l'équipe.");
  return await response.json();
};

export const registerTeamToTournament = async (
  tournoiId: string | number,
  equipeId: string | number,
  token: string,
) => {
  const requestOptions = {
    method: 'POST',
    headers: { Authorization: token },
  };
  const response = await fetch(
    `/api/tournois/${tournoiId}/inscriptions/equipes/${equipeId}`,
    requestOptions,
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'Inscription refusée (Tournoi plein ou fermé ?).',
    );
  }
  return await response.json();
};

export const fetchTeamMatches = async (
  equipeId: string | number,
): Promise<TeamMatch[]> => {
  const response = await fetch(`/api/tournaments/equipes/${equipeId}/matches`);
  if (!response.ok) return [];
  return await response.json();
};

export const unregisterTeam = async (
  tournoiId: string | number,
  equipeId: string | number,
  token: string,
) => {
  const requestOptions = {
    method: 'DELETE',
    headers: { Authorization: token },
  };
  const response = await fetch(
    `/api/tournois/${tournoiId}/inscriptions/equipes/${equipeId}`,
    requestOptions,
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Impossible d'annuler cette inscription.",
    );
  }
};
