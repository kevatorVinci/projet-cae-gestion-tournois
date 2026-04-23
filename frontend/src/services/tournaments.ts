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
  tournamentId: number;
  team1Id?: number;
  team2Id?: number;
  team1Name?: string;
  team2Name?: string;
  round: number;
  scheduledDateTime?: string;
  status: string;
  adminResponsibleId?: number;
  scoreTeam1?: number;
  scoreTeam2?: number;
}

export interface MatchPlayerSelection {
  matchId: number;
  memberId: number;
  memberTag?: string;
  memberSpecialty?: string;
  memberProfileImageUrl?: string;
  teamId: number;
  teamName?: string;
}

export interface MatchPlayerSelectionMember {
  memberId: number;
  tag: string;
  specialty?: string;
  profileImageUrl?: string;
  selected: boolean;
  unavailable?: boolean;
  unavailableStartDate?: string;
  unavailableEndDate?: string;
}

export interface MatchTeamSelectionView {
  matchId: number;
  teamId: number;
  canEdit: boolean;
  maxPlayers: number;
  selectedCount: number;
  members: MatchPlayerSelectionMember[];
}

const parseApiError = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  if (response.status === 401) {
    return 'Session expirée ou invalide. Reconnectez-vous avec un compte admin.';
  }

  if (response.status === 403) {
    return 'Action réservée aux administrateurs.';
  }

  try {
    const json = (await response.json()) as { message?: string };
    if (json?.message) {
      return json.message;
    }
  } catch {
    // Ignore JSON parse errors and fallback to plain text/status.
  }

  try {
    const text = (await response.text()).trim();
    if (text) {
      return `${fallbackMessage} (${response.status}) - ${text}`;
    }
  } catch {
    // Ignore text parsing errors.
  }

  return `${fallbackMessage} (HTTP ${response.status})`;
};

const getAuthorizationHeader = (token: string): string => {
  const normalized = token.trim();
  return /^bearer\s+/i.test(normalized)
    ? normalized.replace(/^bearer\s+/i, 'Bearer ')
    : `Bearer ${normalized}`;
};

const toHeadersRecord = (headers?: HeadersInit): Record<string, string> => {
  const result: Record<string, string> = {};
  const source = new Headers(headers);
  source.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

const fetchWithAdminAuthFallback = async (
  url: string,
  token: string,
  init: RequestInit,
): Promise<Response> => {
  const normalizedToken = token.trim();
  const authVariants = [
    getAuthorizationHeader(normalizedToken),
    normalizedToken,
  ];

  let lastResponse: Response | null = null;
  for (const authorizationValue of authVariants) {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...toHeadersRecord(init.headers),
        Authorization: authorizationValue,
      },
    });

    lastResponse = response;
    if (response.status !== 401) {
      return response;
    }
  }

  return lastResponse as Response;
};

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
    headers: { Authorization: getAuthorizationHeader(token) },
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthorizationHeader(token),
    },
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
    headers: { Authorization: getAuthorizationHeader(token) },
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
      headers: { Authorization: getAuthorizationHeader(token) },
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
    headers: { Authorization: getAuthorizationHeader(token) },
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

export const generateTournamentSchedule = async (
  tournoiId: string | number,
  token: string,
): Promise<TeamMatch[]> => {
  let response = await fetchWithAdminAuthFallback(
    `/api/tournois/${tournoiId}/schedule`,
    token,
    {
      method: 'POST',
    },
  );

  if (response.status === 404) {
    response = await fetchWithAdminAuthFallback(
      `/api/tournaments/${tournoiId}/schedule`,
      token,
      {
        method: 'POST',
      },
    );
  }

  if (response.status === 409) {
    const conflictMessage = await parseApiError(
      response,
      'Le planning existe déjà.',
    );

    if (conflictMessage.toLowerCase().includes('déjà été généré')) {
      return fetchTournamentMatchesAdmin(tournoiId, token);
    }

    throw new Error(conflictMessage);
  }

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        'Impossible de générer le planning des matchs.',
      ),
    );
  }
  return await response.json();
};

export const publishTournamentSchedule = async (
  tournoiId: string | number,
  token: string,
): Promise<void> => {
  let response = await fetchWithAdminAuthFallback(
    `/api/tournois/${tournoiId}/schedule/publish`,
    token,
    {
      method: 'POST',
    },
  );

  if (response.status === 404) {
    response = await fetchWithAdminAuthFallback(
      `/api/tournaments/${tournoiId}/schedule/publish`,
      token,
      {
        method: 'POST',
      },
    );
  }

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        'Impossible de publier le planning des matchs.',
      ),
    );
  }
};

export const fetchTournamentMatches = async (
  tournoiId: string | number,
): Promise<TeamMatch[]> => {
  const response = await fetch(`/api/tournois/${tournoiId}/matches`);
  if (!response.ok) return [];
  return await response.json();
};

export const fetchTournamentMatchesAdmin = async (
  tournoiId: string | number,
  token: string,
): Promise<TeamMatch[]> => {
  let response = await fetchWithAdminAuthFallback(
    `/api/tournois/${tournoiId}/matches/admin`,
    token,
    {
      method: 'GET',
    },
  );

  if (response.status === 404) {
    response = await fetchWithAdminAuthFallback(
      `/api/tournaments/${tournoiId}/matches/admin`,
      token,
      {
        method: 'GET',
      },
    );
  }

  if (!response.ok) return [];
  return await response.json();
};

export const fetchTeamMatches = async (
  equipeId: string | number,
): Promise<TeamMatch[]> => {
  const response = await fetch(`/api/matches/equipes/${equipeId}/matches`);
  if (!response.ok) return [];
  return await response.json();
};

export const fetchMemberMatches = async (
  memberId: string | number,
): Promise<TeamMatch[]> => {
  const response = await fetch(`/api/selections/member/${memberId}/matches`);
  if (!response.ok) return [];
  return await response.json();
};

export const fetchMatchSelections = async (
  matchId: string | number,
  token?: string,
): Promise<MatchPlayerSelection[]> => {
  const response = await fetch(`/api/selections/match/${matchId}`, {
    headers: token
      ? { Authorization: getAuthorizationHeader(token) }
      : undefined,
  });
  if (!response.ok) return [];
  return await response.json();
};

export const fetchTeamSelectionEditor = async (
  matchId: string | number,
  teamId: string | number,
  token: string,
): Promise<MatchTeamSelectionView> => {
  const response = await fetch(
    `/api/selections/match/${matchId}/team/${teamId}/editor`,
    {
      headers: { Authorization: getAuthorizationHeader(token) },
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(response, 'Impossible de charger la composition.'),
    );
  }
  return await response.json();
};

export const updateMatchTeamSelection = async (
  matchId: string | number,
  teamId: string | number,
  memberIds: number[],
  token: string,
): Promise<MatchPlayerSelection[]> => {
  const response = await fetch(
    `/api/selections/match/${matchId}/team/${teamId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthorizationHeader(token),
      },
      body: JSON.stringify({ memberIds }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        'Impossible de mettre à jour la composition.',
      ),
    );
  }
  return await response.json();
};

export const unregisterTeam = async (
  tournoiId: string | number,
  equipeId: string | number,
  token: string,
) => {
  const requestOptions = {
    method: 'DELETE',
    headers: { Authorization: getAuthorizationHeader(token) },
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

export const declareForfeit = async (
  matchId: number,
  teamId: number,
  token: string,
): Promise<void> => {
  const response = await fetch(`/api/matches/${matchId}/forfeit/${teamId}`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error('Impossible de déclarer forfait.');
  }
};
