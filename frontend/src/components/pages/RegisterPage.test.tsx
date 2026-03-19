import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import RegisterPage from './RegisterPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RegisterPage', () => {
  test('renders all form fields and submit button', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/mot de passe/i)).toBeDefined();
    expect(screen.getByLabelText(/tag/i)).toBeDefined();
    expect(screen.getByText(/inscription/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeDefined();
  });

  test('shows error when no avatar is selected', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@vinci.be' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/tag/i), {
      target: { value: 'TestUser' },
    });
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/n'oubliez pas de choisir un avatar/i),
      ).toBeDefined();
    });
  });

  test('navigates to /login on successful registration', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);

    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@vinci.be' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/tag/i), {
      target: { value: 'TestUser' },
    });

    // select an avatar
    const avatars = screen.getAllByRole('img');
    fireEvent.click(avatars[0]);

    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login');
    });
  });

  test('shows error when email already used (401)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'taken@vinci.be' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/tag/i), {
      target: { value: 'TestUser' },
    });

    const avatars = screen.getAllByRole('img');
    fireEvent.click(avatars[0]);

    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/cette adresse email est déjà utilisée/i),
      ).toBeDefined();
    });
  });
});
