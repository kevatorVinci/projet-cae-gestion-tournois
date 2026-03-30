import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import TeamsList from '../../components/pages/TeamPage/TeamsList';
import { UserContext } from '../../contexts/UserContext';
import { getAllEquipes, joinEquipe } from '../../services/teams';
import { decodeJwtPayload } from '../../utils/session';

// 1. Better mock for react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// FIXED PATHS: From src/Tests/Team/ to src/services/
vi.mock('../../services/teams', () => ({
  getAllEquipes: vi.fn(),
  joinEquipe: vi.fn(),
}));

// FIXED PATHS: From src/Tests/Team/ to src/utils/
vi.mock('../../utils/session', () => ({
  decodeJwtPayload: vi.fn(),
}));

const utilisateurAuthentifie = {
  email: 'test@vinci.be',
  token: 'faux-token',
  tag: 'Joueur1',
  specialty: 'tacticien',
  profileImage: 'luffy.png',
  admin: false,
};

const equipeSimulee = [
  {
    id: 1,
    name: 'Les Tacticiens',
    members: [
      {
        id: 99,
        tag: 'AutreJoueur',
        email: 'autre@vinci.be',
        specialty: 'Gardien',
        isResponsable: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Les Gardiens',
    members: [
      {
        id: 1,
        tag: 'Joueur1',
        email: 'test@vinci.be',
        specialty: 'Tacticien',
        isResponsable: false,
      },
    ],
  },
  {
    id: 3,
    name: 'Équipe Vide',
    members: [],
  },
];

describe('TeamsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('affiche la liste des équipes chargées', async () => {
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce(equipeSimulee);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <TeamsList />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/les tacticiens/i)).toBeInTheDocument();
    expect(screen.getByText(/les gardiens/i)).toBeInTheDocument();
  });

  test('filtre les équipes selon la recherche', async () => {
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce(equipeSimulee);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <TeamsList />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    await screen.findByText(/les tacticiens/i);

    fireEvent.change(screen.getByPlaceholderText(/rechercher par nom/i), {
      target: { value: 'Tacticiens' },
    });

    expect(screen.getByText(/les tacticiens/i)).toBeInTheDocument();
    expect(screen.queryByText(/les gardiens/i)).not.toBeInTheDocument();
  });

  test('affiche un message si aucune équipe trouvée', async () => {
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <TeamsList />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/aucune équipe trouvée/i),
    ).toBeInTheDocument();
  });

  test('affiche "Votre équipe" pour l\'équipe de l\'utilisateur connecté', async () => {
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce(equipeSimulee);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <TeamsList />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/votre équipe/i)).toBeInTheDocument();
  });

  test('affiche "Équipe indisponible" pour une équipe sans membres', async () => {
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce(equipeSimulee);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <TeamsList />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/équipe indisponible/i)).toBeInTheDocument();
  });

  test('appelle joinEquipe et navigue vers /notifications après postulation', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 500 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce(equipeSimulee);
    vi.mocked(joinEquipe).mockResolvedValueOnce(undefined as void);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: {
              ...utilisateurAuthentifie,
              tag: 'NewPlayer',
              email: 'new@vinci.be',
            },
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <TeamsList />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    await screen.findByText(/les tacticiens/i);

    const tacticiensTitle = screen.getByText(/les tacticiens/i);
    const tacticiensCard = tacticiensTitle.closest('.MuiCard-root');
    expect(tacticiensCard).not.toBeNull();

    const boutonPostuler = within(tacticiensCard as HTMLElement).getByRole(
      'button',
      {
        name: /postuler/i,
      },
    );
    fireEvent.click(boutonPostuler);

    await waitFor(() => {
      expect(joinEquipe).toHaveBeenCalledWith(1);
      expect(mockNavigate).toHaveBeenCalledWith('/notifications');
    });
  });

  test('affiche les équipes triées par ordre alphabétique', async () => {
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce([
      {
        id: 40,
        name: 'Zeta Squad',
        members: [{ id: 90, tag: 'Zed', isResponsable: true }],
      },
      {
        id: 10,
        name: 'Alpha Team',
        members: [{ id: 20, tag: 'Al', isResponsable: true }],
      },
      {
        id: 20,
        name: 'Beta Crew',
        members: [{ id: 30, tag: 'Be', isResponsable: true }],
      },
    ]);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <TeamsList />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    await screen.findByText(/alpha team/i);

    const headingElements = screen
      .getAllByRole('heading', { level: 6 })
      .map((node) => node.textContent?.trim())
      .filter((text) =>
        ['Alpha Team', 'Beta Crew', 'Zeta Squad'].includes(text || ''),
      );

    expect(headingElements).toEqual(['Alpha Team', 'Beta Crew', 'Zeta Squad']);
  });

  test("affiche une erreur si l'utilisateur est déjà dans une équipe", async () => {
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce(equipeSimulee);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <TeamsList />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    await screen.findByText(/les tacticiens/i);

    const boutonsPostuler = screen.getAllByRole('button', {
      name: /postuler/i,
    });
    fireEvent.click(boutonsPostuler[0]);

    expect(
      await screen.findByText(/vous êtes déjà dans une équipe/i),
    ).toBeInTheDocument();
  });
});
