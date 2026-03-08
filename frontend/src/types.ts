export interface Equipe {
  id: number;
  name: string;
}
export interface Membre {
  id: number;
  tag: string;
  role: 'RESPONSABLE' | 'MEMBRE';
  specialty: string;
  avatarSeed: string;
}

export interface MyTeamData extends Equipe {
  wins: number;
  members: Membre[];
}
