import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '../../components/pages/HomePage/HomePage';
import {
  createAuthenticatedUser,
  createMockUserContext,
  renderWithProviders,
} from '../../test-utils';

const mockNavigate = vi.fn();
const mockGetCurrentUserIdFromToken = vi.fn();
const mockGetUnreadNotificationsByUser = vi.fn();

// Mock react-router-dom
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

// FIXED PATH: From src/Tests/Team/ to src/services/ is only 2 levels up (../../)
vi.mock('../../services/notifications', () => ({
  getCurrentUserIdFromToken: vi.fn(() => mockGetCurrentUserIdFromToken()),
  getUnreadNotificationsByUser: vi.fn((userId: number) =>
    mockGetUnreadNotificationsByUser(userId),
  ),
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les CTA visiteurs et navigue vers les pages publiques', () => {
    renderWithProviders(<HomePage />);

    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(screen.getByText(/where genius meets battle/i)).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenNthCalledWith(1, '/register');
    expect(mockNavigate).toHaveBeenNthCalledWith(2, '/login');
    expect(mockGetUnreadNotificationsByUser).not.toHaveBeenCalled();
  });

  it('affiche l’alerte des notifications non lues pour un utilisateur connecté', async () => {
    mockGetCurrentUserIdFromToken.mockReturnValue(7);
    mockGetUnreadNotificationsByUser.mockResolvedValue([
      {
        idNotification: 1,
        message: 'n1',
        dateEnvoi: '2026-03-13',
        estLue: false,
      },
      {
        idNotification: 2,
        message: 'n2',
        dateEnvoi: '2026-03-13',
        estLue: false,
      },
    ]);

    renderWithProviders(<HomePage />, {
      userContext: createMockUserContext({
        authenticatedUser: createAuthenticatedUser(),
      }),
    });

    const alert = await screen.findByText(
      /vous avez 2 notifications non lues/i,
    );
    fireEvent.click(alert);

    expect(mockGetUnreadNotificationsByUser).toHaveBeenCalledWith(7);
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });

  it('retombe silencieusement à zero si le chargement des notifications échoue', async () => {
    mockGetCurrentUserIdFromToken.mockReturnValue(9);
    mockGetUnreadNotificationsByUser.mockRejectedValue(new Error('boom'));

    renderWithProviders(<HomePage />, {
      userContext: createMockUserContext({
        authenticatedUser: createAuthenticatedUser({ email: 'admin@vinci.be' }),
      }),
    });

    await waitFor(() => {
      expect(mockGetUnreadNotificationsByUser).toHaveBeenCalledWith(9);
    });

    expect(screen.queryByText(/notification non lue/i)).not.toBeInTheDocument();
  });
});
