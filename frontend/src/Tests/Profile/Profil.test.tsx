import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import Profile from '../../components/pages/Dashbord/Profile';
import { UserContext } from '../../contexts/UserContext';
import { getUserTeam } from '../../services/teams';
import {
  fetchMemberMatches,
  fetchTournamentById,
} from '../../services/tournaments';

// 1. Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actual, useNavigate: vi.fn() };
});

// FIXED PATH: From src/Tests/Team/ to src/services/ is only 2 levels up (../../)
vi.mock('../../services/teams', () => ({
  getUserTeam: vi.fn(),
}));

vi.mock('../../services/tournaments', () => ({
  fetchMemberMatches: vi.fn(),
  fetchTournamentById: vi.fn(),
}));

const mockAuthenticatedUser = {
  id: 42,
  email: 'test@vinci.be',
  token: 'fake-token',
  tag: 'Pedrinho08',
  specialty: 'Tacticien',
  profileImage: 'luffy.png',
  admin: false,
};

const mockTeam = {
  id: 1,
  name: 'Les Tacticiens',
  members: [],
};

const mockRegistrations = [
  {
    id: 12,
    nom: 'Spring Cup',
    etat: 'EN_COURS',
    dateDebut: '2026-03-20T10:00:00.000Z',
    dateFin: '2026-03-30T10:00:00.000Z',
    dateLimiteInscription: '2026-03-10T10:00:00.000Z',
  },
];

const mockMatches = [
  {
    id: 44,
    tournamentId: 12,
    team1Name: 'Les Tacticiens',
    team2Name: 'Les Champions',
    round: 1,
    scheduledDateTime: '2026-03-21T18:30:00.000Z',
    status: 'TERMINE',
    scoreTeam1: 2,
    scoreTeam2: 1,
  },
];

const mockHistoryMatches = [
  {
    id: 44,
    tournamentId: 12,
    team1Id: 1,
    team2Id: 2,
    team1Name: 'Les Tacticiens',
    team2Name: 'Les Champions',
    round: 1,
    scheduledDateTime: '2026-03-21T18:30:00.000Z',
    status: 'TERMINE',
    scoreTeam1: 2,
    scoreTeam2: 1,
  },
];

// Helper to wrap the component with required providers
const renderProfile = (user = mockAuthenticatedUser) => {
  return render(
    <MemoryRouter>
      <UserContext.Provider
        value={{
          authenticatedUser: user,
          loginUser: vi.fn(),
          registerUser: vi.fn(),
          clearUser: vi.fn(),
          updateUser: vi.fn(),
        }}
      >
        <Profile />
      </UserContext.Provider>
    </MemoryRouter>,
  );
};

describe('Profile', () => {
  test('displays the user tag, role and email', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce([]);
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    // Use getByRole to specifically target the name in the profile card
    expect(
      screen.getByRole('heading', { name: /^pedrinho08$/i, level: 5 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tacticien/i)).toBeInTheDocument();
    expect(screen.getByText(/test@vinci.be/i)).toBeInTheDocument();
  });

  test('shows "Pas d\'équipe" when user has no team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce([]);
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/pas d'équipe/i)).toBeInTheDocument();
    });
  });

  test('displays team name when user has a team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(mockTeam);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce([]);
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeInTheDocument();
    });
  });

  test('shows create and join cards when user has no team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce([]);
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/créer une équipe/i)).toBeInTheDocument();
      expect(screen.getByText(/rejoindre une équipe/i)).toBeInTheDocument();
    });
  });

  test('hides create and join cards when user has a team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(mockTeam);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce([]);
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    await waitFor(() => {
      // Use queryByText because the element is expected to be absent
      expect(screen.queryByText(/créer mon équipe/i)).toBeNull();
      expect(screen.queryByText(/chercher une équipe/i)).toBeNull();
    });
  });

  test('navigates to /disponibilites when clicking "Mes indisponibilités"', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce([]);
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    screen.getByRole('button', { name: /mes indisponibilités/i }).click();

    expect(navigateMock).toHaveBeenCalledWith('/disponibilites');
  });

  test('navigates to /profile when clicking "Modifier le profil"', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce([]);
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    screen.getByRole('button', { name: /modifier le profil/i }).click();

    expect(navigateMock).toHaveBeenCalledWith('/profile');
  });

  test('displays tournament and match history when the user has a team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(mockTeam);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce(
      mockHistoryMatches as never,
    );
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/tournois participés/i)).toBeInTheDocument();
      expect(screen.getByText(/historique des matchs/i)).toBeInTheDocument();
      expect(screen.getAllByText(/spring cup/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/vs les champions/i)).toBeInTheDocument();
      expect(screen.getByText(/^2 - 1$/i)).toBeInTheDocument();
    });
  });

  test('displays history even when the user has no team anymore', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce(
      mockHistoryMatches as never,
    );
    vi.mocked(fetchTournamentById).mockResolvedValueOnce(
      mockRegistrations[0] as never,
    );

    renderProfile();

    await waitFor(() => {
      expect(screen.getAllByText(/spring cup/i).length).toBeGreaterThan(0);
      expect(
        screen.getByText(/les tacticiens vs les champions/i),
      ).toBeInTheDocument();
    });
  });
});
