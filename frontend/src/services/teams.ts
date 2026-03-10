export type EquipeMember = {
  id?: number;
  tag: string;
  avatar?: string;
  speciality?: string;
  role?: string;
};

export type Equipe = {
  id: number;
  name: string;
  responsable?: EquipeMember;
  members: EquipeMember[];
};

export async function getAllEquipes(): Promise<Equipe[]> {
  const response = await fetch('/api/equipes');
  if (!response.ok) {
    throw new Error('Erreur lors de la recuperation des equipes');
  }
  return response.json() as Promise<Equipe[]>;
}

export async function getEquipeById(id: string | number): Promise<Equipe> {
  const response = await fetch(`/api/equipes/${id}`);
  if (!response.ok) {
    throw new Error('Impossible de trouver cette equipe');
  }
  return response.json() as Promise<Equipe>;
}

// Créer une nouvelle équipe
export async function createEquipe(name: string): Promise<Equipe> {
  const response = await fetch('/api/equipes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }), // On envoie le nom en JSON
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la création de l'équipe");
  }
  return response.json();
}

// Rejoindre une équipe (on envoie l'ID de l'équipe)
export async function joinEquipe(teamId: number): Promise<void> {
  const response = await fetch(`/api/equipes/${teamId}/rejoindre`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // On ajoutera le token JWT ici plus tard
    },
  });

  if (!response.ok) {
    throw new Error('Impossible de rejoindre cette équipe.');
  }
}
