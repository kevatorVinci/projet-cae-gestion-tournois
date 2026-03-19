import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import Profile from './Profil';
import { UserContext } from '../../../contexts/UserContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock('../../../services/teams', () => ({
  getUserTeam: vi.fn(),
}));

import { getUserTeam } from '../../../services/teams';

const mockAuthenticatedUser = {
  email: 'test@vinci.be',
  token: 'fake-token',
  tag: 'Pedrinho08',
  specialty: 'Tacticien',
  profileImage: 'luffy.png',
  admin: false,
};

const mockTeam = {
  id: 1,
  name: 'Les Tacticiens',
  members: [],
};

describe('Profile', () => {
  test('displays the user tag, role and email', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

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
          <Profile />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/pedrinho08/i)).toBeDefined();
    expect(screen.getByText(/tacticien/i)).toBeDefined();
    expect(screen.getByText(/test@vinci.be/i)).toBeDefined();
  });

  test('shows "Pas d\'équipe" when user has no team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

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
          <Profile />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/pas d'équipe/i)).toBeDefined();
    });
  });

  test('displays team name when user has a team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(mockTeam);

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
          <Profile />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
    });
  });

  test('shows create and join cards when user has no team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

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
          <Profile />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/créer une équipe/i)).toBeDefined();
      expect(screen.getByText(/rejoindre une équipe/i)).toBeDefined();
    });
  });

  test('hides create and join cards when user has a team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(mockTeam);

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
          <Profile />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText(/créer mon équipe/i)).toBeNull();
      expect(screen.queryByText(/chercher une équipe/i)).toBeNull();
    });
  });

  test('navigates to /disponibilites when clicking "Mes indisponibilités"', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

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
          <Profile />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    screen.getByRole('button', { name: /mes indisponibilités/i }).click();

    expect(navigateMock).toHaveBeenCalledWith('/disponibilites');
  });

  test('navigates to /profile when clicking "Modifier le profil"', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

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
          <Profile />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    screen.getByRole('button', { name: /modifier le profil/i }).click();

    expect(navigateMock).toHaveBeenCalledWith('/profile');
  });
});
