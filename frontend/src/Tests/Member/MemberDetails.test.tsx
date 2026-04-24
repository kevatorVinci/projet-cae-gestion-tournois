import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType, AuthenticatedUser } from '../../types';
import MemberDetails from '../../components/pages/Member/MemberDetails';
import { getAllEquipes } from '../../services/teams';
import {
  fetchMemberMatches,
  fetchTournamentById,
} from '../../services/tournaments';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('../../utils/session', () => ({
  getAuthenticatedUser: vi.fn(() => ({ token: 'fake-token' })),
  storeAuthenticatedUser: vi.fn(),
  clearAuthenticatedUser: vi.fn(),
  isTokenExpired: vi.fn(() => false),
}));

vi.mock('../../services/teams', () => ({
  getAllEquipes: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        name: 'Straw Hat Crew',
        members: [
          {
            id: 1,
            tag: 'Luffy',
            specialty: 'Captain',
            profileImageUrl: '/luffy.png',
            isResponsable: true,
          },
        ],
      },
    ]),
  ),
}));

vi.mock('../../services/tournaments', () => ({
  fetchMemberMatches: vi.fn(() => Promise.resolve([])),
  fetchTournamentById: vi.fn(() => Promise.resolve(null)),
}));

const mockAuthUser: AuthenticatedUser = {
  tag: 'Luffy',
  email: 'luffy@strawhat.com',
  password: 'gear5password',
  token: 'valid-token',
  specialty: 'Captain',
  admin: false,
};

const mockUsersResponse = [
  {
    id: 1,
    tag: 'Luffy',
    email: 'luffy@strawhat.com',
    specialty: 'Captain',
    profileImageUrl: '/luffy.png',
  },
];

const mockHistoryMatches = [
  {
    id: 44,
    tournamentId: 12,
    team1Id: 1,
    team2Id: 2,
    team1Name: 'Straw Hat Crew',
    team2Name: 'Marines',
    round: 1,
    scheduledDateTime: '2026-03-21T18:30:00.000Z',
    status: 'TERMINE',
    scoreTeam1: 2,
    scoreTeam2: 1,
  },
];

describe('MemberDetails Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as Mock;
  });

  const renderComponent = (
    authenticatedUser: AuthenticatedUser | undefined,
    memberId = '1',
  ) => {
    const contextValue: UserContextType = {
      authenticatedUser,
      registerUser: vi.fn(),
      loginUser: vi.fn(),
      clearUser: vi.fn(),
      updateUser: vi.fn(),
    };

    return render(
      <UserContext.Provider value={contextValue}>
        <MemoryRouter initialEntries={[`/member/${memberId}`]}>
          <Routes>
            <Route path="/member/:id" element={<MemberDetails />} />
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>,
    );
  };

  it('renders loading state initially', () => {
    (global.fetch as Mock).mockReturnValue(new Promise(() => {}));
    renderComponent(undefined);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays user data correctly from the API', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsersResponse,
    });

    renderComponent(undefined);

    await waitFor(() => {
      expect(screen.getAllByText('Luffy').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Captain').length).toBeGreaterThan(0);
    });
  });

  it('shows email and specialty fields on own profile', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsersResponse,
    });

    renderComponent(mockAuthUser);

    await waitFor(() => {
      expect(screen.getAllByText('Luffy').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('luffy@strawhat.com')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getAllByText('Captain').length).toBeGreaterThan(0);
  });

  it('hides sensitive information when tags do not match', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsersResponse,
    });

    renderComponent({ ...mockAuthUser, tag: 'Zoro' });

    await waitFor(() => {
      expect(screen.getAllByText('Luffy').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('luffy@strawhat.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => [],
    });
    vi.mocked(getAllEquipes).mockResolvedValueOnce([]);

    renderComponent(undefined, 'unknown-player');

    await waitFor(() => {
      expect(screen.getByText(/Joueur introuvable/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('navigates to team detail when clicking the team block', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsersResponse,
    });

    renderComponent(undefined);

    const teamLabel = await screen.findByText('Straw Hat Crew');
    fireEvent.click(teamLabel);

    expect(mockNavigate).toHaveBeenCalledWith('/equipes/1');
  });

  it('keeps match history when player has no current team', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUsersResponse,
    });

    vi.mocked(getAllEquipes).mockResolvedValueOnce([]);
    vi.mocked(fetchMemberMatches).mockResolvedValueOnce(mockHistoryMatches);
    vi.mocked(fetchTournamentById).mockResolvedValueOnce({
      id: 12,
      nom: 'Spring Cup',
      etat: 'TERMINE',
      dateDebut: '2026-03-01T10:00:00.000Z',
    });

    renderComponent(undefined, 'Luffy');

    await waitFor(() => {
      expect(
        screen.getByText(/straw hat crew vs marines/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/victoire de straw hat crew/i),
      ).toBeInTheDocument();
    });
  });
});
