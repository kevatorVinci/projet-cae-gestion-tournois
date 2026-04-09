import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AdminTournamentsPage from '../../components/pages/Tournaments/AdminTournamentsPage';
import {
  fetchAllTournaments,
  publishTournament,
} from '../../services/tournaments';
import {
  createAuthenticatedUser,
  createMockUserContext,
  renderWithProviders,
} from '../../test-utils';

const mockNavigate = vi.fn();

vi.mock('../../services/tournois', () => ({
  fetchAllTournaments: vi.fn(),
  publishTournament: vi.fn(),
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

  test('sorts tournaments by state priority then closest date', async () => {
    const formatDateWithOffset = (offsetInDays: number) => {
      const value = new Date();
      value.setDate(value.getDate() + offsetInDays);
      return value.toISOString().slice(0, 10);
    };

    vi.mocked(fetchAllTournaments).mockResolvedValue([
      {
        id: 21,
        nom: 'Termine Recent',
        dateDebut: formatDateWithOffset(-2),
        dateFin: formatDateWithOffset(-1),
        dateLimiteInscription: formatDateWithOffset(-7),
        etat: 'TERMINE',
      },
      {
        id: 22,
        nom: 'Ouvert Proche',
        dateDebut: formatDateWithOffset(2),
        dateFin: formatDateWithOffset(4),
        dateLimiteInscription: formatDateWithOffset(1),
        etat: 'OUVERT',
      },
      {
        id: 23,
        nom: 'En Cours',
        dateDebut: formatDateWithOffset(-1),
        dateFin: formatDateWithOffset(1),
        dateLimiteInscription: formatDateWithOffset(-5),
        etat: 'EN_COURS',
      },
      {
        id: 24,
        nom: 'Ouvert Lointain',
        dateDebut: formatDateWithOffset(25),
        dateFin: formatDateWithOffset(27),
        dateLimiteInscription: formatDateWithOffset(20),
        etat: 'OUVERT',
      },
      {
        id: 25,
        nom: 'Cloture',
        dateDebut: formatDateWithOffset(10),
        dateFin: formatDateWithOffset(12),
        dateLimiteInscription: formatDateWithOffset(5),
        etat: 'CLOTURE',
      },
    ]);

    const userContext = createMockUserContext({
      authenticatedUser: createAuthenticatedUser({ admin: true }),
    });

    renderWithProviders(<AdminTournamentsPage />, {
      route: '/admin/tournaments',
      userContext,
    });

    const enCours = await screen.findByText('En Cours');
    const ouvertProche = screen.getByText('Ouvert Proche');
    const ouvertLointain = screen.getByText('Ouvert Lointain');
    const cloture = screen.getByText('Cloture');
    const termineRecent = screen.getByText('Termine Recent');

    expect(
      enCours.compareDocumentPosition(ouvertProche) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      ouvertProche.compareDocumentPosition(ouvertLointain) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      ouvertLointain.compareDocumentPosition(termineRecent) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      cloture.compareDocumentPosition(termineRecent) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
