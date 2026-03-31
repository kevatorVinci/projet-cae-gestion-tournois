import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType, AuthenticatedUser } from '../../types';
import MemberDetails from '../../components/pages/Member/MemberDetails';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

// Mocking the session utility
vi.mock('../../utils/session', () => ({
  getAuthenticatedUser: vi.fn(() => ({ token: 'fake-token' })),
  storeAuthenticatedUser: vi.fn(),
  clearAuthenticatedUser: vi.fn(),
  isTokenExpired: vi.fn(() => false),
}));

// Adjusted to fit your provided AuthenticatedUser interface
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
    expect(screen.getByText(/Recherche du profil/i)).toBeInTheDocument();
  });

  it('fetches and displays user data correctly from the teams API', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    renderComponent(undefined);

    await waitFor(() => {
      expect(screen.getByText('Luffy')).toBeInTheDocument();
      expect(screen.getByText('Captain')).toBeInTheDocument();
    });
  });

  it('shows private email and masked password when tags match (own profile)', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    // Components matches "Luffy" from AuthContext with "Luffy" from API
    renderComponent(mockAuthUser);

    await waitFor(() => {
      expect(screen.getByText('luffy@strawhat.com')).toBeInTheDocument();
    });

    expect(screen.getByText('********')).toBeInTheDocument();

    // Use Option 2: Find icon by test ID
    const visibilityIcon = screen.getByTestId('VisibilityIcon');
    const toggleBtn = visibilityIcon.closest('button');

    if (!toggleBtn)
      throw new Error('Could not find the password toggle button');

    fireEvent.click(toggleBtn);

    expect(screen.getByText('gear5password')).toBeInTheDocument();
    expect(screen.getByTestId('VisibilityOffIcon')).toBeInTheDocument();
  });

  it('hides sensitive information when tags do not match', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    // Logged in as Zoro, but viewing Luffy's page
    renderComponent({ ...mockAuthUser, tag: 'Zoro' });

    await waitFor(() => {
      expect(screen.getByText('Luffy')).toBeInTheDocument();
    });

    // Sensitive fields should be hidden
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
      expect(screen.getByText(/Recherche du profil/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
