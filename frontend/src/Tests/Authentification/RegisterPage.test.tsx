/* eslint-disable no-irregular-whitespace */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import RegisterPage from '../../components/pages/RegisterPage';

// 1. Mock de react-router-dom
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

// 2. Mock du service d'authentification
const authServiceMock = {
  register: vi.fn(),
};

vi.mock('../../../services/auth', () => ({
  // Changed any[] to unknown[] to satisfy ESLint
  register: (...args: unknown[]) => authServiceMock.register(...args),
}));

describe.skip('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@vinci.be' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'password123' },
    });

    const confirmInput = screen.queryByLabelText(/confirmer/i);
    if (confirmInput) {
      fireEvent.change(confirmInput, { target: { value: 'password123' } });
    }

    fireEvent.change(screen.getByLabelText(/tag/i), {
      target: { value: 'Player1' },
    });
  };

  test('renders all form fields and submit button', () => {
    render(
      <MemoryRouter>
                <RegisterPage />     {' '}
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /s'inscrire/i }),
    ).toBeInTheDocument();
  });

  test('shows error when no avatar is selected', async () => {
    render(
      <MemoryRouter>
                <RegisterPage />     {' '}
      </MemoryRouter>,
    );

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    expect(await screen.findByText(/choisir un avatar/i)).toBeInTheDocument();
  });

  test('navigates to /login on successful registration', async () => {
    authServiceMock.register.mockResolvedValueOnce({
      user: { id: 1, email: 'test@vinci.be' },
      token: 'fake-token',
    });

    render(
      <MemoryRouter>
                <RegisterPage />     {' '}
      </MemoryRouter>,
    );

    fillForm();
    const avatars = screen.getAllByRole('img');
    fireEvent.click(avatars[0]);

    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      },
      { timeout: 2000 },
    );
  });

  test('shows error when email already used (401)', async () => {
    const errorResponse = {
      response: {
        status: 401,
        data: "L'adresse email est déjà utilisée",
      },
    };

    authServiceMock.register.mockRejectedValueOnce(errorResponse);

    render(
      <MemoryRouter>
                <RegisterPage />     {' '}
      </MemoryRouter>,
    );

    fillForm();

    const avatars = screen.getAllByRole('img');
    fireEvent.click(avatars[0]);

    const submitBtn = screen.getByRole('button', { name: /s'inscrire/i });
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        const error = screen.queryByText(/déjà utilisé|déjà utilisée/i);
        expect(error).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
