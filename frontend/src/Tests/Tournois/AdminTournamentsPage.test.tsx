import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AdminTournamentsPage from '../../components/pages/Tournois/AdminTournamentsPage';
import {
  cancelTournamentWithReason,
  closeRegistrations,
  fetchAllTournaments,
  publishTournament,
} from '../../services/tournois';
import {
  createAuthenticatedUser,
  createMockUserContext,
  renderWithProviders,
} from '../../test-utils';

const mockNavigate = vi.fn();

vi.mock('../../services/tournois', () => ({
  fetchAllTournaments: vi.fn(),
  publishTournament: vi.fn(),
  closeRegistrations: vi.fn(),
  cancelTournamentWithReason: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminTournamentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('publishes a draft tournament and shows a success message', async () => {
    vi.mocked(fetchAllTournaments).mockResolvedValue([
      {
        id: 1,
        nom: 'Draft Cup',
        dateDebut: '2025-06-10',
        dateFin: '2025-06-12',
        dateLimiteInscription: '2025-06-01',
        etat: 'BROUILLON',
      },
    ]);
    vi.mocked(publishTournament).mockResolvedValue(undefined);

    const userContext = createMockUserContext({
      authenticatedUser: createAuthenticatedUser({ admin: true }),
    });

    renderWithProviders(<AdminTournamentsPage />, {
      route: '/admin/tournaments',
      userContext,
    });

    expect(await screen.findByText('Draft Cup')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /publier/i }));

    await waitFor(() => {
      expect(publishTournament).toHaveBeenCalledWith(
        1,
        userContext.authenticatedUser!.token,
      );
    });

    expect(
      await screen.findByText(/Le tournoi est maintenant publié/i),
    ).toBeInTheDocument();
  });

  test('closes registrations for open tournaments', async () => {
    vi.mocked(fetchAllTournaments).mockResolvedValue([
      {
        id: 7,
        nom: 'Open Masters',
        dateDebut: '2025-07-10',
        dateFin: '2025-07-12',
        dateLimiteInscription: '2025-07-01',
        etat: 'OUVERT',
      },
    ]);
    vi.mocked(closeRegistrations).mockResolvedValue(undefined);

    const userContext = createMockUserContext({
      authenticatedUser: createAuthenticatedUser({ admin: true }),
    });

    renderWithProviders(<AdminTournamentsPage />, { userContext });

    expect(await screen.findByText('Open Masters')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Clôturer/i }));

    await waitFor(() => {
      expect(closeRegistrations).toHaveBeenCalledWith(
        7,
        userContext.authenticatedUser!.token,
      );
    });
  });

  test('refuses cancellation when the reason is empty', async () => {
    vi.mocked(fetchAllTournaments).mockResolvedValue([
      {
        id: 9,
        nom: 'Cancelable Cup',
        dateDebut: '2025-08-10',
        dateFin: '2025-08-12',
        dateLimiteInscription: '2025-08-01',
        etat: 'OUVERT',
      },
    ]);

    vi.stubGlobal(
      'prompt',
      vi.fn(() => '   '),
    );

    const userContext = createMockUserContext({
      authenticatedUser: createAuthenticatedUser({ admin: true }),
    });

    renderWithProviders(<AdminTournamentsPage />, { userContext });

    expect(await screen.findByText('Cancelable Cup')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(cancelTournamentWithReason).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/Veuillez saisir une raison d'annulation/i),
    ).toBeInTheDocument();
  });

  test('cancels a tournament when a reason is provided', async () => {
    vi.mocked(fetchAllTournaments).mockResolvedValue([
      {
        id: 11,
        nom: 'Final Cup',
        dateDebut: '2025-09-10',
        dateFin: '2025-09-12',
        dateLimiteInscription: '2025-09-01',
        etat: 'EN_COURS',
      },
    ]);
    vi.mocked(cancelTournamentWithReason).mockResolvedValue(undefined);
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'Terrain indisponible'),
    );

    const userContext = createMockUserContext({
      authenticatedUser: createAuthenticatedUser({ admin: true }),
    });

    renderWithProviders(<AdminTournamentsPage />, { userContext });

    expect(await screen.findByText('Final Cup')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    await waitFor(() => {
      expect(cancelTournamentWithReason).toHaveBeenCalledWith(
        11,
        userContext.authenticatedUser!.token,
        'Terrain indisponible',
      );
    });
  });
});
