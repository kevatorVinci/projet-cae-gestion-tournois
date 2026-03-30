import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import TournoiPage from '../../components/pages/Tournois/TournoiPage';

const mockNavigate = vi.fn();

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

describe('TournoiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('displays tournaments by categories in the default view', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          nom: 'Arena Live',
          dateDebut: '2025-01-10',
          dateFin: '2025-01-12',
          dateLimiteInscription: '2025-01-01',
          etat: 'EN_COURS',
        },
        {
          id: 2,
          nom: 'Future Cup',
          dateDebut: '2025-03-10',
          dateFin: '2025-03-12',
          dateLimiteInscription: '2025-03-01',
          etat: 'OUVERT',
          nombresParticipantsMax: 8,
        },
        {
          id: 3,
          nom: 'Canceled Clash',
          dateDebut: '2024-05-10',
          dateFin: '2024-05-12',
          dateLimiteInscription: '2024-05-01',
          etat: 'ANNULE',
        },
      ],
    } as Response);

    render(
      <MemoryRouter>
        <TournoiPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Arena Live')).toBeInTheDocument();
    expect(screen.getByText('Future Cup')).toBeInTheDocument();
    expect(screen.getByText('Canceled Clash')).toBeInTheDocument();
    expect(screen.getByText(/Tournois passés/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Arena Live'));
    expect(mockNavigate).toHaveBeenCalledWith('/tournois/1');
  });

  test('shows an error message when tournaments cannot be loaded', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    render(
      <MemoryRouter>
        <TournoiPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        /Impossible de charger les tournois pour le moment\./i,
      ),
    ).toBeInTheDocument();
  });

  test('filters by search term and refetches data', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 10,
            nom: 'Spring Championship',
            dateDebut: '2025-04-10',
            dateFin: '2025-04-12',
            dateLimiteInscription: '2025-04-01',
            etat: 'OUVERT',
          },
        ],
      } as Response);

    render(
      <MemoryRouter>
        <TournoiPage />
      </MemoryRouter>,
    );

    const searchField = await screen.findByLabelText(/Rechercher un tournoi/i);
    fireEvent.change(searchField, { target: { value: 'spring' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith('/api/tournois/?nom=spring');
    });

    expect(await screen.findByText('Spring Championship')).toBeInTheDocument();
  });

  test('resets search and state filters with the reset button', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    render(
      <MemoryRouter>
        <TournoiPage />
      </MemoryRouter>,
    );

    const searchField = await screen.findByLabelText(/Rechercher un tournoi/i);
    const stateSelect = screen.getByLabelText(/État/i);
    const resetButton = screen.getByRole('button', { name: /Réinitialiser/i });

    expect(resetButton).toBeDisabled();

    fireEvent.change(searchField, { target: { value: 'spring' } });
    fireEvent.mouseDown(stateSelect);
    fireEvent.click(await screen.findByRole('option', { name: 'En cours' }));

    await waitFor(() => {
      expect(resetButton).not.toBeDisabled();
    });

    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(searchField).toHaveValue('');
      expect(stateSelect).toHaveTextContent('Tous');
      expect(resetButton).toBeDisabled();
    });
  });
});
