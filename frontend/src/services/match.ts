import { getAuthenticatedUser } from '../utils/session';
import { Match } from '../types';

// 1. Récupérer les matchs d'une équipe
export const fetchTeamMatches = async (teamId: number): Promise<Match[]> => {
  const token = getAuthenticatedUser()?.token;
  const response = await fetch(`/api/teams/${teamId}/matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Erreur lors du chargement des matchs');
  return response.json();
};

// 2. Accepter ou Refuser un score (Le bouton du capitaine !)
export const validateMatchScore = async (
  matchId: number,
  teamId: number,
  isAccepted: boolean,
) => {
  const token = getAuthenticatedUser()?.token;
  const response = await fetch(
    `/api/results/match/${matchId}/validate/${teamId}?isAccepted=${isAccepted}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) throw new Error('Impossible de valider le score');
  return response.json();
};
