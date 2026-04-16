import { getAuthenticatedUser } from '../utils/session';

export interface Period {
  id: number;
  dateDebut: string;
  dateFin: string;
}

const API_BASE = '/api';

// Use the SAME token approach as teams.ts
function getAuthHeaders(): HeadersInit {
  const token = getAuthenticatedUser()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 1. Read my unavailable periods
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

// 2. Add an unavailable period
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
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }
  return response.json();
};

// 3. Delete an unavailable period
export const deleteIndisponibilite = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/indisponibilites/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) throw new Error('Erreur lors de la suppression');
};
