import { getAuthenticatedUser } from '../utils/session';

export interface Period {
  id: number;
  dateDebut: string;
  dateFin: string;
}

const API_BASE = '/api';

// On utilise LA MÊME méthode que teams.ts pour le token !
function getAuthHeaders(): HeadersInit {
  const token = getAuthenticatedUser()?.token;
  return token ? { Authorization: token } : {};
}

// 1. Lire mes indisponibilités
export const getMesIndisponibilites = async (): Promise<Period[]> => {
  const response = await fetch(`${API_BASE}/indisponibilites`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Erreur lors de la récupération');
  return response.json();
};

// 2. Ajouter une indisponibilité
export const addIndisponibilite = async (
  dateDebut: string,
  dateFin: string,
): Promise<Period> => {
  const response = await fetch(`${API_BASE}/indisponibilites`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dateDebut, dateFin }),
  });
  if (!response.ok) throw new Error("Erreur lors de l'ajout");
  return response.json();
};

// 3. Supprimer une indisponibilité
export const deleteIndisponibilite = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/indisponibilites/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) throw new Error('Erreur lors de la suppression');
};
