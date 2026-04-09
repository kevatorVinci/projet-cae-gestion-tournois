import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import DisponibilitesPage from '../../components/pages/MySpace/AvailabilitiesPage';
import {
  getMesIndisponibilites,
  deleteIndisponibilite,
} from '../../services/unavailabilities';

// 1. Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actual, useNavigate: vi.fn() };
});

// 2. Mock availability services
vi.mock('../../services/indisponibilites', () => ({
  getMesIndisponibilites: vi.fn(),
  addIndisponibilite: vi.fn(),
  deleteIndisponibilite: vi.fn(),
}));

const mockPeriods = [
  { id: 1, dateDebut: '2026-04-01', dateFin: '2026-04-05' },
  { id: 2, dateDebut: '2026-05-10', dateFin: '2026-05-15' },
];

describe('DisponibilitesPage', () => {
  test('renders the title and section headers', async () => {
    vi.mocked(getMesIndisponibilites).mockResolvedValueOnce(mockPeriods);

    render(
      <MemoryRouter>
        <DisponibilitesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/mes indisponibilités/i)).toBeInTheDocument();
    expect(screen.getByText(/ajouter une période/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/mes absences prévues/i)).toBeInTheDocument();
    });
  });

  test('displays periods loaded from the API', async () => {
    vi.mocked(getMesIndisponibilites).mockResolvedValueOnce(mockPeriods);

    render(
      <MemoryRouter>
        <DisponibilitesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      // Verify both periods appear (matching the formatted display date)
      expect(screen.getByText(/01\/04\/2026/)).toBeInTheDocument();
      expect(screen.getByText(/10\/05\/2026/)).toBeInTheDocument();
    });
  });

  test('shows empty state message when there are no periods', async () => {
    vi.mocked(getMesIndisponibilites).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <DisponibilitesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/aucune indisponibilité de prévue/i),
      ).toBeInTheDocument();
    });
  });

  test('shows error message when loading fails', async () => {
    vi.mocked(getMesIndisponibilites).mockRejectedValueOnce(
      new Error('Erreur serveur'),
    );

    render(
      <MemoryRouter>
        <DisponibilitesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/impossible de charger vos données/i),
      ).toBeInTheDocument();
    });
  });

  test('shows error when clicking "Ajouter" without selecting dates', async () => {
    vi.mocked(getMesIndisponibilites).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <DisponibilitesPage />
      </MemoryRouter>,
    );

    const addButton = await screen.findByRole('button', { name: /ajouter/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText(/veuillez sélectionner une date/i),
      ).toBeInTheDocument();
    });
  });

  test('calls deleteIndisponibilite when clicking the delete button', async () => {
    vi.mocked(getMesIndisponibilites).mockResolvedValueOnce(mockPeriods);
    vi.mocked(deleteIndisponibilite).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <DisponibilitesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/01\/04\/2026/)).toBeInTheDocument();
    });

    // Click the first delete icon button (often an IconButton in MUI)
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteIndisponibilite).toHaveBeenCalledWith(1);
    });
  });

  test('navigates to /profil when clicking the back button', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(getMesIndisponibilites).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <DisponibilitesPage />
      </MemoryRouter>,
    );

    const backButton = screen.getByRole('button', {
      name: /retour au profil/i,
    });
    fireEvent.click(backButton);

    expect(navigateMock).toHaveBeenCalledWith('/profil');
  });
});
