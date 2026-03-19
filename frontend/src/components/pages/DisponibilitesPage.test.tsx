import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import DisponibilitesPage from './DisponibilitesPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

// Mock availability services to avoid real API calls
vi.mock('../../services/indisponibilites', () => ({
  getMesIndisponibilites: vi.fn(),
  addIndisponibilite: vi.fn(),
  deleteIndisponibilite: vi.fn(),
}));

import {
  getMesIndisponibilites,
  addIndisponibilite,
  deleteIndisponibilite,
} from '../../services/indisponibilites';

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

    expect(screen.getByText(/mes indisponibilités/i)).toBeDefined();
    expect(screen.getByText(/ajouter une période/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/mes absences prévues/i)).toBeDefined();
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
      // Verify both periods appear
      expect(screen.getByText(/01\/04\/2026/)).toBeDefined();
      expect(screen.getByText(/10\/05\/2026/)).toBeDefined();
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
      ).toBeDefined();
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
      ).toBeDefined();
    });
  });

  test('shows error when clicking "Ajouter" without selecting dates', async () => {
    vi.mocked(getMesIndisponibilites).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <DisponibilitesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ajouter/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    await waitFor(() => {
      expect(screen.getByText(/veuillez sélectionner une date/i)).toBeDefined();
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
      expect(screen.getByText(/01\/04\/2026/)).toBeDefined();
    });

    // Click the first delete icon button
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

    fireEvent.click(screen.getByRole('button', { name: /retour au profil/i }));

    expect(navigateMock).toHaveBeenCalledWith('/profil');
  });
});
