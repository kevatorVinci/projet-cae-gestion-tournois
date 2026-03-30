import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../../components/pages/ConnectionPage/LoginPage';
import { createMockUserContext, renderWithProviders } from '../../test-utils';

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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permet de basculer l’affichage du mot de passe', () => {
    renderWithProviders(<LoginPage />);

    const passwordField = screen.getByLabelText(/password/i);
    expect(passwordField).toHaveAttribute('type', 'password');

    const toggleButton = screen
      .getAllByRole('button')
      .find((button) => button.textContent === '');

    expect(toggleButton).toBeDefined();
    fireEvent.click(toggleButton!);

    expect(passwordField).toHaveAttribute('type', 'text');
  });

  it('soumet les identifiants et redirige vers l’accueil', async () => {
    const loginUser = vi.fn(async () => {});

    renderWithProviders(<LoginPage />, {
      userContext: createMockUserContext({ loginUser }),
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joueur@vinci.be' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Secret123!' },
    });
    fireEvent.click(screen.getByLabelText(/se souvenir de moi/i));
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith(
        { email: 'joueur@vinci.be', password: 'Secret123!' },
        true,
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('affiche un message d’erreur si la connexion échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const loginUser = vi.fn(async () => {
      throw new Error('Le mot de passe est incorrect.');
    });

    renderWithProviders(<LoginPage />, {
      userContext: createMockUserContext({ loginUser }),
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joueur@vinci.be' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'bad-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(
      await screen.findByText(/identifiants incorrects\./i),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
