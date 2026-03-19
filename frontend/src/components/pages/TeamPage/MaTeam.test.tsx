import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import { MyTeam } from './MaTeam';

vi.mock('react-router-dom', async () => {
  const actuel = await vi.importActual('react-router-dom');
  return { ...actuel, useNavigate: vi.fn() };
});

// On simule les services d'équipe pour ne pas faire de vraies requêtes
vi.mock('../../../services/teams', () => ({
  getUserTeam: vi.fn(),
  isCurrentUserResponsable: vi.fn(),
  leaveEquipe: vi.fn(),
  promoteResponsable: vi.fn(),
  depromoteResponsable: vi.fn(),
}));

// On simule les utilitaires de session
vi.mock('../../../utils/session', () => ({
  getAuthenticatedUser: vi.fn(),
  decodeJwtPayload: vi.fn(),
}));

import {
  getUserTeam,
  isCurrentUserResponsable,
  leaveEquipe,
  promoteResponsable,
  depromoteResponsable,
} from '../../../services/teams';
import { getAuthenticatedUser, decodeJwtPayload } from '../../../utils/session';

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

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
      expect(screen.getByText(/joueur1/i)).toBeDefined();
      expect(screen.getByText(/joueur2/i)).toBeDefined();
    });
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

    await waitFor(() => {
      expect(screen.getByText(/aucune équipe/i)).toBeDefined();
    });
  });

  test('affiche une erreur si le chargement échoue', async () => {
    vi.mocked(getAuthenticatedUser).mockReturnValue({
      token: 'fake-token',
      email: 'test@vinci.be',
      admin: false,
    });
    vi.mocked(decodeJwtPayload).mockReturnValue({ id: 1 });
    vi.mocked(getUserTeam).mockRejectedValueOnce(new Error('Erreur serveur'));
    vi.mocked(isCurrentUserResponsable).mockRejectedValueOnce(
      new Error('Erreur serveur'),
    );

    render(
      <MemoryRouter>
        <MyTeam />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/impossible de charger votre équipe/i),
      ).toBeDefined();
    });
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
    vi.mocked(getUserTeam).mockRejectedValueOnce(new Error('Session expiree'));
    vi.mocked(isCurrentUserResponsable).mockResolvedValueOnce(false);

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

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /quitter/i }));

    await waitFor(() => {
      expect(screen.getByText(/êtes-vous sûr/i)).toBeDefined();
    });
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

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
    });

    // On ouvre le dialogue
    fireEvent.click(screen.getByRole('button', { name: /quitter/i }));

    await waitFor(() => {
      expect(screen.getByText(/êtes-vous sûr/i)).toBeDefined();
    });

    // On confirme
    fireEvent.click(screen.getByRole('button', { name: /^quitter$/i }));

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

    await waitFor(() => {
      expect(screen.getByText(/nommer responsable/i)).toBeDefined();
    });

    // On clique sur nommer responsable pour Joueur2
    fireEvent.click(
      screen.getByRole('button', { name: /nommer responsable/i }),
    );

    // On confirme dans le dialogue
    await waitFor(() => {
      expect(screen.getByText(/confirmer la promotion/i)).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /^confirmer$/i }));

    await waitFor(() => {
      expect(promoteResponsable).toHaveBeenCalledWith(2);
    });
  });

  test('appelle depromoteResponsable au clic sur deheriter', async () => {
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deheriter/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /deheriter/i }));

    await waitFor(() => {
      expect(depromoteResponsable).toHaveBeenCalledWith(2);
    });
  });
});
