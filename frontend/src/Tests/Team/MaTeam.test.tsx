import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, test, expect, vi } from 'vitest';
import { MyTeam } from '../../components/pages/TeamPage/MyTeam';
import {
  getUserTeam,
  isCurrentUserResponsable,
  promoteResponsable,
  depromoteResponsable,
  leaveEquipe,
} from '../../services/teams';
import {
  fetchTeamRegistrationsPublic,
  fetchTeamMatchTimeline,
} from '../../services/tournaments';
import { getAuthenticatedUser, decodeJwtPayload } from '../../utils/session';

vi.mock('react-router-dom', async () => {
  const actuel =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actuel, useNavigate: vi.fn() };
});

vi.mock('../../services/teams', () => ({
  getUserTeam: vi.fn(),
  isCurrentUserResponsable: vi.fn(),
  leaveEquipe: vi.fn(),
  promoteResponsable: vi.fn(),
  depromoteResponsable: vi.fn(),
}));

vi.mock('../../services/tournaments', () => ({
  fetchTeamRegistrationsPublic: vi.fn(),
  fetchTeamMatchTimeline: vi.fn(),
}));

vi.mock('../../utils/session', () => ({
  getAuthenticatedUser: vi.fn(),
  decodeJwtPayload: vi.fn(),
}));

const equipeSimulee = {
  id: 1,
  name: 'Les Tacticiens',
  members: [
    {
      id: 1,
      tag: 'Joueur1',
      specialty: 'Tacticien',
      isResponsable: true,
      profileImage: '',
    },
    {
      id: 2,
      tag: 'Joueur2',
      specialty: 'Gardien',
      isResponsable: false,
      profileImage: '',
    },
  ],
};

describe('MyTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTeamRegistrationsPublic).mockResolvedValue([]);
    vi.mocked(fetchTeamMatchTimeline).mockResolvedValue([]);
  });

  test("affiche le nom de l'équipe et les membres", async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockResolvedValueOnce(equipeSimulee);
    vi.mocked(isCurrentUserResponsable).mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/les tacticiens/i)).toBeDefined();
    expect(screen.getByText(/joueur1/i)).toBeDefined();
    expect(screen.getByText(/joueur2/i)).toBeDefined();
  });

  test("affiche un message si l'utilisateur n'a pas d'équipe", async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);
    vi.mocked(isCurrentUserResponsable).mockResolvedValueOnce(false);

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/aucune équipe/i)).toBeDefined();
  });

  test('affiche une erreur si le chargement échoue', async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });

    // Simulating a failure
    vi.mocked(getUserTeam).mockRejectedValueOnce(new Error('Erreur serveur'));

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    const msg = await screen.findByText(/aucune équipe/i);
    expect(msg).toBeDefined();
  });

  test('redirige vers /login si la session est expirée', async () => {
    const naviguerMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(naviguerMock);
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockRejectedValueOnce(new Error('Session expirée'));

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(naviguerMock).toHaveBeenCalledWith('/login');
    });
  });

  test("ouvre le dialogue de confirmation pour quitter l'équipe", async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockResolvedValueOnce(equipeSimulee);
    vi.mocked(isCurrentUserResponsable).mockResolvedValueOnce(false);

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    const quitterBtn = await screen.findByRole('button', {
      name: /quitter l'équipe/i,
    });
    fireEvent.click(quitterBtn);

    expect(await screen.findByText(/êtes-vous sûr/i)).toBeDefined();
  });

  test('appelle leaveEquipe et navigue vers /equipes après confirmation', async () => {
    const naviguerMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(naviguerMock);
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockResolvedValueOnce(equipeSimulee);
    vi.mocked(isCurrentUserResponsable).mockResolvedValueOnce(false);
    vi.mocked(leaveEquipe).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    const quitterBtn = await screen.findByRole('button', {
      name: /quitter l'équipe/i,
    });
    fireEvent.click(quitterBtn);

    const confirmBtn = await screen.findByRole('button', {
      name: /^quitter$/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(leaveEquipe).toHaveBeenCalled();
      expect(naviguerMock).toHaveBeenCalledWith('/equipes');
    });
  });

  test('appelle promoteResponsable au clic sur nommer responsable', async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockResolvedValue(equipeSimulee);
    vi.mocked(isCurrentUserResponsable).mockResolvedValue(true);
    vi.mocked(promoteResponsable).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    const joueur2Name = await screen.findByText(/joueur2/i);
    const joueur2Card = joueur2Name.closest('.MuiPaper-root');
    expect(joueur2Card).not.toBeNull();

    const promoteBtn = within(joueur2Card as HTMLElement).getByRole('checkbox');
    fireEvent.click(promoteBtn);

    const confirmBtn = await screen.findByRole('button', {
      name: /^confirmer$/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(promoteResponsable).toHaveBeenCalledWith(2);
    });
  });

  test('appelle depromoteResponsable au clic sur retirer le rôle', async () => {
    const equipeAvecDeuxResponsables = {
      ...equipeSimulee,
      members: [
        { ...equipeSimulee.members[0], isResponsable: true },
        { ...equipeSimulee.members[1], isResponsable: true },
      ],
    };

    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockResolvedValue(equipeAvecDeuxResponsables);
    vi.mocked(isCurrentUserResponsable).mockResolvedValue(true);
    vi.mocked(depromoteResponsable).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    const joueur2Name = await screen.findByText(/joueur2/i);
    const joueur2Card = joueur2Name.closest('.MuiPaper-root');
    expect(joueur2Card).not.toBeNull();

    const depromoteBtn = within(joueur2Card as HTMLElement).getByRole(
      'checkbox',
    );

    fireEvent.click(depromoteBtn);

    await waitFor(() => {
      expect(depromoteResponsable).toHaveBeenCalledWith(2);
    });
  });

  test('affiche les responsables en haut puis trie les membres par tag', async () => {
    const equipeTrieeAttendue = {
      ...equipeSimulee,
      members: [
        {
          id: 4,
          tag: 'Zeta',
          specialty: 'Gardien',
          isResponsable: false,
          profileImage: '',
        },
        {
          id: 2,
          tag: 'Bravo',
          specialty: 'Tacticien',
          isResponsable: true,
          profileImage: '',
        },
        {
          id: 3,
          tag: 'Alpha',
          specialty: 'Architecte',
          isResponsable: true,
          profileImage: '',
        },
        {
          id: 1,
          tag: 'Charlie',
          specialty: 'Exécuteur',
          isResponsable: false,
          profileImage: '',
        },
      ],
    };

    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 99 });
    vi.mocked(getUserTeam).mockResolvedValueOnce(equipeTrieeAttendue);
    vi.mocked(isCurrentUserResponsable).mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    await screen.findByText('Alpha');

    const membersList = screen.getByRole('list', { name: 'team-members-list' });
    const listItems = within(membersList).getAllByRole('listitem');
    const orderedTags = listItems.map((item) => {
      const match = item.textContent?.match(/(Alpha|Bravo|Charlie|Zeta)/);
      return match ? match[1] : '';
    });

    expect(orderedTags).toEqual(['Alpha', 'Bravo', 'Charlie', 'Zeta']);
  });

  test('affiche les tournois à venir, en cours et passés', async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockResolvedValueOnce(equipeSimulee);
    vi.mocked(isCurrentUserResponsable).mockResolvedValueOnce(false);
    vi.mocked(fetchTeamRegistrationsPublic).mockResolvedValueOnce([
      {
        tournoiId: 10,
        equipeId: 1,
        tournoi: {
          id: 10,
          nom: 'Tournoi Futur',
          etat: 'OUVERT',
          dateDebut: '2030-05-10',
        },
      },
      {
        tournoiId: 11,
        equipeId: 1,
        tournoi: {
          id: 11,
          nom: 'Tournoi Live',
          etat: 'EN_COURS',
          dateDebut: '2030-05-01',
        },
      },
      {
        tournoiId: 12,
        equipeId: 1,
        tournoi: {
          id: 12,
          nom: 'Tournoi Terminé',
          etat: 'TERMINE',
          dateDebut: '2024-04-01',
        },
      },
    ]);

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Historique des tournois'),
    ).toBeInTheDocument();
    expect(screen.getByText('Tournoi Futur')).toBeInTheDocument();
    expect(screen.getByText('Tournoi Live')).toBeInTheDocument();
    expect(screen.getByText('Tournoi Terminé')).toBeInTheDocument();
    expect(await screen.findAllByText(/^à venir$/i)).not.toHaveLength(0);
    expect(screen.getAllByText(/^en cours$/i)).not.toHaveLength(0);
    expect(screen.getAllByText(/^passés$/i)).not.toHaveLength(0);
  });
});
