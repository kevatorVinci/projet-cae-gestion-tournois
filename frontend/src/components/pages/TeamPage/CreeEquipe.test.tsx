import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import { CreateEquipe } from './CreeEquipe';
import { UserContext } from '../../../contexts/UserContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock('../../../services/teams', () => ({
  createEquipe: vi.fn(),
}));

import { createEquipe } from '../../../services/teams';

const mockAuthenticatedUser = {
  email: 'test@vinci.be',
  token: 'fake-token',
  tag: 'TestUser',
  specialty: 'tacticien',
  profileImage: 'luffy.png',
  admin: false,
};

describe('CreateEquipe', () => {
  test('renders title, team name field and submit button', () => {
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: mockAuthenticatedUser,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <CreateEquipe />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/créer une team/i)).toBeDefined();
    expect(screen.getByLabelText(/nom de l'équipe/i)).toBeDefined();
    expect(
      screen.getByRole('button', { name: /fonder l'équipe/i }),
    ).toBeDefined();
  });

  test('submit button is disabled when the field is empty', () => {
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: mockAuthenticatedUser,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <CreateEquipe />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole('button', {
      name: /fonder l'équipe/i,
    });
    expect(submitButton.hasAttribute('disabled')).toBe(true);
  });

  test('redirects to /login when user is not authenticated', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: undefined,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <CreateEquipe />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/nom de l'équipe/i), {
      target: { value: 'Mon Équipe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /fonder l'équipe/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login');
    });
  });

  test('calls createEquipe and navigates to /maTeam on success', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(createEquipe).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: mockAuthenticatedUser,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <CreateEquipe />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/nom de l'équipe/i), {
      target: { value: 'Les Architectes du Chaos' },
    });
    fireEvent.click(screen.getByRole('button', { name: /fonder l'équipe/i }));

    await waitFor(() => {
      expect(createEquipe).toHaveBeenCalledWith('Les Architectes du Chaos');
      expect(navigateMock).toHaveBeenCalledWith('/maTeam');
    });
  });

  test('shows error message when createEquipe fails', async () => {
    vi.mocked(createEquipe).mockRejectedValueOnce(
      new Error("Nom d'équipe déjà utilisé."),
    );

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: mockAuthenticatedUser,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <CreateEquipe />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/nom de l'équipe/i), {
      target: { value: 'Mon Équipe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /fonder l'équipe/i }));

    await waitFor(() => {
      expect(screen.getByText(/nom d'équipe déjà utilisé/i)).toBeDefined();
    });
  });
});
