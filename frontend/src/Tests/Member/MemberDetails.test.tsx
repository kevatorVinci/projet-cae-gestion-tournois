import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType, AuthenticatedUser } from '../../types';
import MemberDetails from '../../components/pages/Member/MemberDetails';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

vi.mock('../../utils/session', () => ({
  getAuthenticatedUser: vi.fn(() => ({ token: 'fake-token' })),
  storeAuthenticatedUser: vi.fn(),
  clearAuthenticatedUser: vi.fn(),
  isTokenExpired: vi.fn(() => false),
}));

vi.mock('../../services/tournois', () => ({
  fetchTeamRegistrationsPublic: vi.fn(() => Promise.resolve([])),
}));

const mockAuthUser: AuthenticatedUser = {
  tag: 'Luffy',
  email: 'luffy@strawhat.com',
  password: 'gear5password',
  token: 'valid-token',
  specialty: 'Captain',
  admin: false,
};

const mockTeamsResponse = [
  {
    id: 1,
    name: 'Straw Hat Crew',
    membres: [
      {
        id: 1,
        tag: 'Luffy',
        specialty: 'Captain',
        profileImageUrl: '/luffy.png',
        isResponsable: true,
      },
    ],
  },
];

describe('MemberDetails Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as Mock;
  });

  const renderComponent = (
    authenticatedUser: AuthenticatedUser | undefined,
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
        <MemoryRouter initialEntries={['/member/1']}>
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
<<<<<<< HEAD
    expect(screen.getByText(/Recherche du profil/i)).toBeInTheDocument();
=======
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
>>>>>>> 239dc5d53fcf3821bcc9ac6dbd04d42de791bfc2
  });

  it('fetches and displays user data correctly from the teams API', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    renderComponent(undefined);

    await waitFor(() => {
      expect(screen.getAllByText('Luffy').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Captain').length).toBeGreaterThan(0);
    });
  });

  it('does not show email or password even on own profile', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    renderComponent(mockAuthUser);

    await waitFor(() => {
      expect(screen.getAllByText('Luffy').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('luffy@strawhat.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Mail')).not.toBeInTheDocument();
    expect(screen.queryByText('Mot de Passe')).not.toBeInTheDocument();
    expect(screen.queryByText('gear5password')).not.toBeInTheDocument();
  });

  it('hides sensitive information when tags do not match', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    renderComponent({ ...mockAuthUser, tag: 'Zoro' });

    await waitFor(() => {
      expect(screen.getAllByText('Luffy').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('Mail')).not.toBeInTheDocument();
    expect(screen.queryByText('Mot de Passe')).not.toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    renderComponent(undefined);

    await waitFor(() => {
<<<<<<< HEAD
      expect(screen.getByText(/Recherche du profil/i)).toBeInTheDocument();
=======
      expect(screen.getByText('Joueur introuvable')).toBeInTheDocument();
>>>>>>> 239dc5d53fcf3821bcc9ac6dbd04d42de791bfc2
    });

    consoleSpy.mockRestore();
  });
});
