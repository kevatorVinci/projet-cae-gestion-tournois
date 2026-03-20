import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '../../components/pages/ProfilePage';
import { UserContext } from '../../contexts/UserContext';

// 1. Mock react-router-dom correctly
vi.mock('react-router-dom', async () => {
  const actuel =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actuel, useNavigate: vi.fn() };
});

// 2. Setup fetch mock properly
const mockFetch = vi.fn();
global.fetch = mockFetch;

const utilisateurAuthentifie = {
  email: 'test@vinci.be',
  token: 'faux-token',
  tag: 'UtilisateurTest',
  specialty: 'tacticien',
  profileImage: 'luffy.png',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('affiche le titre et les champs du formulaire', () => {
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <ProfilePage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/mon profil/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe actuel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/confirmer le mot de passe/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sauvegarder/i }),
    ).toBeInTheDocument();
  });

  test('affiche une erreur si les nouveaux mots de passe ne correspondent pas', async () => {
    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <ProfilePage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/nouveau mot de passe/i), {
      target: { value: 'nouveauMotDePasse123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
      target: { value: 'motDePasseDifferent' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sauvegarder/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/les nouveaux mots de passe ne correspondent pas/i),
      ).toBeInTheDocument();
    });
  });

  test('navigue vers / après une sauvegarde réussie', async () => {
    const naviguerMock = vi.fn();
    const mettreAJourUtilisateurMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(naviguerMock);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'new-token' }),
    });

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: mettreAJourUtilisateurMock,
          }}
        >
          <ProfilePage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /sauvegarder/i }));

    await waitFor(() => {
      expect(naviguerMock).toHaveBeenCalledWith('/');
    });
  });

  test("affiche une erreur si l'ancien mot de passe est incorrect", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <ProfilePage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /sauvegarder/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/l'ancien mot de passe est incorrect/i),
      ).toBeInTheDocument();
    });
  });

  test('affiche une erreur si le serveur est inaccessible', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Erreur réseau'));

    render(
      <MemoryRouter>
        <UserContext.Provider
          value={{
            authenticatedUser: utilisateurAuthentifie,
            loginUser: vi.fn(),
            registerUser: vi.fn(),
            clearUser: vi.fn(),
            updateUser: vi.fn(),
          }}
        >
          <ProfilePage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /sauvegarder/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/impossible de contacter le serveur/i),
      ).toBeInTheDocument();
    });
  });
});
