import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import Profile from './Profil';
import { UserContext } from '../../../contexts/UserContext';
import { getUserTeam } from '../../../services/teams';

// Mock de react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

// Mock du service teams
vi.mock('../../../services/teams', () => ({
  getUserTeam: vi.fn(),
}));

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

// Helper pour wrapper le composant avec les providers nécessaires
const renderProfile = (user = mockAuthenticatedUser) => {
  return render(
    <MemoryRouter>
      <UserContext.Provider
        value={{
          authenticatedUser: user,
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
};

describe('Profile', () => {
  test('displays the user tag, role and email', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

    renderProfile();

    // Correction : Utilisation de getByRole pour cibler spécifiquement le nom dans la carte
    // Cela évite le conflit avec le titre "Bonjour Pedrinho08"
    expect(
      screen.getByRole('heading', { name: /^pedrinho08$/i, level: 5 }),
    ).toBeDefined();
    expect(screen.getByText(/tacticien/i)).toBeDefined();
    expect(screen.getByText(/test@vinci.be/i)).toBeDefined();
  });

  test('shows "Pas d\'équipe" when user has no team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/pas d'équipe/i)).toBeDefined();
    });
  });

  test('displays team name when user has a team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(mockTeam);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/les tacticiens/i)).toBeDefined();
    });
  });

  test('shows create and join cards when user has no team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/créer une équipe/i)).toBeDefined();
      expect(screen.getByText(/rejoindre une équipe/i)).toBeDefined();
    });
  });

  test('hides create and join cards when user has a team', async () => {
    vi.mocked(getUserTeam).mockResolvedValueOnce(mockTeam);

    renderProfile();

    await waitFor(() => {
      // Utilisation de queryByText car on s'attend à ce que l'élément soit ABSENT
      expect(screen.queryByText(/créer mon équipe/i)).toBeNull();
      expect(screen.queryByText(/chercher une équipe/i)).toBeNull();
    });
  });

  test('navigates to /disponibilites when clicking "Mes indisponibilités"', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

    renderProfile();

    screen.getByRole('button', { name: /mes indisponibilités/i }).click();

    expect(navigateMock).toHaveBeenCalledWith('/disponibilites');
  });

  test('navigates to /profile when clicking "Modifier le profil"', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(getUserTeam).mockResolvedValueOnce(null);

    renderProfile();

    screen.getByRole('button', { name: /modifier le profil/i }).click();

    expect(navigateMock).toHaveBeenCalledWith('/profile');
  });
});
