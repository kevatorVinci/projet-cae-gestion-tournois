import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import TeamsList from './TeamsList';
import { UserContext } from '../../../contexts/UserContext';

vi.mock('react-router-dom', async () => {
  const actuel = await vi.importActual('react-router-dom');
  return { ...actuel, useNavigate: vi.fn() };
});

vi.mock('../../../services/teams', () => ({
  getAllEquipes: vi.fn(),
  joinEquipe: vi.fn(),
}));

vi.mock('../../../utils/session', () => ({
  decodeJwtPayload: vi.fn(),
}));

import { getAllEquipes, joinEquipe } from '../../../services/teams';
import { decodeJwtPayload } from '../../../utils/session';

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

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
      expect(screen.getByText(/les gardiens/i)).toBeDefined();
    });
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

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText(/rechercher par nom/i), {
      target: { value: 'Tacticiens' },
    });

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
      expect(screen.queryByText(/les gardiens/i)).toBeNull();
    });
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

    await waitFor(() => {
      expect(screen.getByText(/aucune équipe trouvée/i)).toBeDefined();
    });
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

    await waitFor(() => {
      expect(screen.getByText(/votre équipe/i)).toBeDefined();
    });
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

    await waitFor(() => {
      expect(screen.getByText(/équipe indisponible/i)).toBeDefined();
    });
  });

  test('appelle joinEquipe et navigue vers /notifications après postulation', async () => {
    const naviguerMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(naviguerMock);
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 99 });
    vi.mocked(getAllEquipes).mockResolvedValueOnce(equipeSimulee);
    vi.mocked(joinEquipe).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: {
              ...utilisateurAuthentifie,
              tag: 'AutreJoueur2',
              email: 'autre2@vinci.be',
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

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
    });

    // On clique sur le premier bouton "Postuler" disponible
    const boutonsPostuler = screen.getAllByRole('button', {
      name: /postuler/i,
    });
    fireEvent.click(boutonsPostuler[0]);

    await waitFor(() => {
      expect(joinEquipe).toHaveBeenCalled();
      expect(naviguerMock).toHaveBeenCalledWith('/notifications');
    });
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

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
    });

    // On clique sur "Postuler" d'une autre équipe alors qu'on est déjà dans une équipe
    const boutonsPostuler = screen.getAllByRole('button', {
      name: /postuler/i,
    });
    fireEvent.click(boutonsPostuler[0]);

    await waitFor(() => {
      expect(screen.getByText(/vous êtes déjà dans une équipe/i)).toBeDefined();
    });
  });
});
