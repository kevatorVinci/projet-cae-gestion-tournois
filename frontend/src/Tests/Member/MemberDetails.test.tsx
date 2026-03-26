import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import MemberDetails from '../../components/pages/Member/MemberDetails';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocking the session utility
vi.mock('../../utils/session', () => ({
  getAuthenticatedUser: vi.fn(() => ({ token: 'fake-token' })),
  storeAuthenticatedUser: vi.fn(),
  clearAuthenticatedUser: vi.fn(),
  isTokenExpired: vi.fn(() => false),
}));

const mockUser = {
  tag: 'Luffy',
  email: 'luffy@strawhat.com',
  password: 'gear5password',
  token: 'valid-token'
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
    global.fetch = vi.fn();
  });

  const renderComponent = (authenticatedUser: any) => {
    return render(
      <UserContext.Provider value={{ 
        authenticatedUser, 
        registerUser: vi.fn(),
        loginUser: vi.fn(),
        clearUser: vi.fn(),
        updateUser: vi.fn(),
      }}>
        <MemoryRouter initialEntries={['/member/1']}>
          <Routes>
            <Route path="/member/:id" element={<MemberDetails />} />
          </Routes>
        </MemoryRouter>
      </UserContext.Provider>
    );
  };

  it('renders loading state initially', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {})); 
    renderComponent(undefined);
    expect(screen.getByText(/Chargement.../i)).toBeInTheDocument();
  });

  it('fetches and displays user data correctly from the teams API', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    renderComponent(undefined);

    await waitFor(() => {
      expect(screen.getByText('Luffy')).toBeInTheDocument();
      expect(screen.getByText('Captain')).toBeInTheDocument();
    });
  });

  it('shows private email and masked password when viewing own profile', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    renderComponent(mockUser);

    await waitFor(() => {
      expect(screen.getByText('luffy@strawhat.com')).toBeInTheDocument();
    });

    // Check password is masked
    expect(screen.getByText('********')).toBeInTheDocument();

    // Option 2: Find the VisibilityIcon by its data-testid and click its parent button
    const visibilityIcon = screen.getByTestId('VisibilityIcon');
    const toggleBtn = visibilityIcon.closest('button');
    
    if (!toggleBtn) throw new Error('Could not find the password toggle button');
    
    fireEvent.click(toggleBtn);

    // Should now reveal the actual password
    expect(screen.getByText('gear5password')).toBeInTheDocument();
    
    // The icon should have changed to VisibilityOffIcon
    expect(screen.getByTestId('VisibilityOffIcon')).toBeInTheDocument();
  });

  it('hides sensitive information when viewing another member', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTeamsResponse,
    });

    renderComponent({ tag: 'Zoro', token: 'zoro-token' });

    await waitFor(() => {
      expect(screen.getByText('Luffy')).toBeInTheDocument();
    });

    expect(screen.queryByText('Mail')).not.toBeInTheDocument();
    expect(screen.queryByText('Mot de Passe')).not.toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    renderComponent(undefined);

    await waitFor(() => {
      expect(screen.getByText(/Chargement.../i)).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });
});