import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import RegisterPage from '../../components/pages/MySpace/RegisterPage';

// 1. Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

// 2. Mock teams service (called on mount)
vi.mock('../../services/teams', () => ({
  getAllEquipes: vi.fn().mockResolvedValue([]),
  joinEquipe: vi.fn(),
}));

// 3. Mock global fetch (the component uses fetch directly)
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillForm = async () => {
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@vinci.be' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/tag/i), {
      target: { value: 'Player1' },
    });
  };

  test('renders all form fields and submit button', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
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
        <RegisterPage />
      </MemoryRouter>,
    );

    await fillForm();

    // Submit the form directly to bypass native HTML validation
    const form = screen
      .getByRole('button', { name: /s'inscrire/i })
      .closest('form')!;
    fireEvent.submit(form);

    expect(
      await screen.findByText(/choisir ton plus bel avatar/i),
    ).toBeInTheDocument();
  });

  test('navigates to /login on successful registration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: 1, email: 'test@vinci.be' },
        token: 'fake-token',
      }),
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await fillForm();

    // Select an avatar
    const avatars = screen.getAllByAltText(/avatar /i);
    fireEvent.click(avatars[0]);

    const form = screen
      .getByRole('button', { name: /s'inscrire/i })
      .closest('form')!;
    fireEvent.submit(form);

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      },
      { timeout: 2000 },
    );
  });

  test('shows error when email already used (401)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await fillForm();

    const avatars = screen.getAllByAltText(/avatar /i);
    fireEvent.click(avatars[0]);

    const form = screen
      .getByRole('button', { name: /s'inscrire/i })
      .closest('form')!;
    fireEvent.submit(form);

    await waitFor(
      () => {
        expect(
          screen.getByText(/cette adresse email est déjà utilisée/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
