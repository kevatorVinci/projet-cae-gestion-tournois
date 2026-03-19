import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import ProfilePage from './ProfilePage';
import { UserContext } from '../../contexts/UserContext';

vi.mock('react-router-dom', async () => {
  const actuel = await vi.importActual('react-router-dom');
  return { ...actuel, useNavigate: vi.fn() };
});

const recupererFetch = vi.fn();
global.fetch = recupererFetch;

const utilisateurAuthentifie = {
  email: 'test@vinci.be',
  token: 'faux-token',
  tag: 'UtilisateurTest',
  specialty: 'tacticien',
  profileImage: 'luffy.png',
};

describe('ProfilePage', () => {
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

    expect(screen.getByText(/mon profil/i)).toBeDefined();
    expect(screen.getByLabelText(/mot de passe actuel/i)).toBeDefined();
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeDefined();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /sauvegarder/i })).toBeDefined();
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
      ).toBeDefined();
    });
  });

  test('navigue vers / après une sauvegarde réussie', async () => {
    const naviguerMock = vi.fn();
    const mettreAJourUtilisateurMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(naviguerMock);

    recupererFetch.mockResolvedValueOnce({ ok: true });

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
    recupererFetch.mockResolvedValueOnce({ ok: false });

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
      ).toBeDefined();
    });
  });

  test('affiche une erreur si le serveur est inaccessible', async () => {
    // On simule une erreur réseau
    recupererFetch.mockRejectedValueOnce(new Error('Erreur réseau'));

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
      ).toBeDefined();
    });
  });
});
