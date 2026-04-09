import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import TournoiDetailPage from '../../components/pages/Tournaments/TournoiDetailPage';
import {
  getEquipeById,
  getUserTeam,
  isCurrentUserResponsable,
} from '../../services/teams';
import {
  fetchTeamRegistrations,
  registerTeamToTournament,
} from '../../services/tournaments';

vi.mock('../../utils/session', () => ({
  getAuthenticatedUser: vi.fn(() => undefined),
}));

vi.mock('../../services/teams', () => ({
  getEquipeById: vi.fn(),
  getUserTeam: vi.fn(),
  isCurrentUserResponsable: vi.fn(),
}));

vi.mock('../../services/tournois', () => ({
  fetchTeamRegistrations: vi.fn(),
  registerTeamToTournament: vi.fn(),
}));

const tournoiMock = {
  id: 6,
  nom: 'Tournoi Test',
  description: 'Tournoi de test',
  dateDebut: '2026-05-01',
  dateFin: '2026-05-03',
  dateLimiteInscription: '2026-04-25',
  etat: 'OUVERT',
  nombresParticipantsMax: 16,
  gagnant: null,
};

describe('TournoiDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as Mock;
    vi.mocked(isCurrentUserResponsable).mockResolvedValue(false);
    vi.mocked(getUserTeam).mockResolvedValue(null as never);
    vi.mocked(fetchTeamRegistrations).mockResolvedValue([]);
    vi.mocked(registerTeamToTournament).mockResolvedValue(undefined as never);
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/tournois/6']}>
        <Routes>
          <Route path="/tournois/:id" element={<TournoiDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('charge le logo équipe en fallback via getEquipeById quand absent dans accepted', async () => {
    vi.mocked(getEquipeById).mockResolvedValue({
      id: 1,
      name: 'Alpha',
      profileImage: 'akatsuki.jpg',
      members: [],
    });

    (global.fetch as Mock).mockImplementation((input: string) => {
      if (input === '/api/tournois/6') {
        return Promise.resolve({
          ok: true,
          json: async () => tournoiMock,
        });
      }

      if (input === '/api/tournois/6/inscriptions/accepted') {
        return Promise.resolve({
          ok: true,
          json: async () => [{ equipeId: 1, equipeName: 'Alpha' }],
        });
      }

      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    renderPage();

    await screen.findByText(/équipes inscrites/i);

    await waitFor(() => {
      expect(getEquipeById).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(document.querySelector('img[src="/akatsuki.jpg"]')).toBeTruthy();
    });
  });

  it('utilise directement equipeProfileImage quand déjà fournie', async () => {
    vi.mocked(getEquipeById).mockResolvedValue({
      id: 1,
      name: 'Alpha',
      profileImage: 'akatsuki.jpg',
      members: [],
    });

    (global.fetch as Mock).mockImplementation((input: string) => {
      if (input === '/api/tournois/6') {
        return Promise.resolve({
          ok: true,
          json: async () => tournoiMock,
        });
      }

      if (input === '/api/tournois/6/inscriptions/accepted') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              equipeId: 1,
              equipeName: 'Alpha',
              equipeProfileImage: 'espada.jpg',
            },
          ],
        });
      }

      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    renderPage();

    await screen.findByText(/équipes inscrites/i);

    await waitFor(() => {
      expect(document.querySelector('img[src="/espada.jpg"]')).toBeTruthy();
    });

    expect(getEquipeById).not.toHaveBeenCalled();
  });
});
