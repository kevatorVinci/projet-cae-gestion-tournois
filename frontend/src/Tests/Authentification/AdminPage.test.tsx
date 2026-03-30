import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPage from '../../components/pages/AdminPage';
import {
  createAuthenticatedUser,
  createMockUserContext,
  renderWithProviders,
} from '../../test-utils';

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

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  );
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('charge les joueurs et filtre la liste de recherche', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() =>
      jsonResponse([
        {
          email: 'admin@vinci.be',
          token: 'token',
          tag: 'AdminSelf',
          admin: true,
          profileImage: 'self.png',
        },
        {
          email: 'joueur@vinci.be',
          token: 'token2',
          tag: 'Joueur',
          admin: false,
          profileImage: 'player.png',
        },
      ]),
    );

    renderWithProviders(<AdminPage />, {
      userContext: createMockUserContext({
        authenticatedUser: createAuthenticatedUser({
          email: 'admin@vinci.be',
          admin: true,
        }),
      }),
    });

    expect(await screen.findByText('AdminSelf')).toBeInTheDocument();
    expect(screen.getByText(/vous-même/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /nommer admin/i }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/chercher un joueur/i), {
      target: { value: 'joueur' },
    });

    expect(screen.queryByText('AdminSelf')).not.toBeInTheDocument();
    expect(screen.getByText('joueur@vinci.be')).toBeInTheDocument();
  });

  it('met a jour le role admin puis recharge les utilisateurs', async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() =>
        jsonResponse([
          {
            email: 'admin@vinci.be',
            token: 'token',
            tag: 'AdminSelf',
            admin: true,
            profileImage: 'self.png',
          },
          {
            email: 'joueur@vinci.be',
            token: 'token2',
            tag: 'Joueur',
            admin: false,
            profileImage: 'player.png',
          },
        ]),
      )
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(null, { status: 200 })),
      )
      .mockImplementationOnce(() =>
        jsonResponse([
          {
            email: 'admin@vinci.be',
            token: 'token',
            tag: 'AdminSelf',
            admin: true,
            profileImage: 'self.png',
          },
          {
            email: 'joueur@vinci.be',
            token: 'token2',
            tag: 'Joueur',
            admin: true,
            profileImage: 'player.png',
          },
        ]),
      );

    renderWithProviders(<AdminPage />, {
      userContext: createMockUserContext({
        authenticatedUser: createAuthenticatedUser({
          email: 'admin@vinci.be',
          admin: true,
          token: 'secure-token',
        }),
      }),
    });

    fireEvent.click(
      await screen.findByRole('button', { name: /nommer admin/i }),
    );

    expect(
      await screen.findByText(/le rôle a été mis à jour avec succès/i),
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/auths/addAdmin',
      expect.objectContaining({
        method: 'PUT',
        body: 'joueur@vinci.be',
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByText('Administrateur')).toHaveLength(2);
    });
  });

  it('affiche une erreur si le chargement initial echoue', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'));

    renderWithProviders(<AdminPage />, {
      userContext: createMockUserContext({
        authenticatedUser: createAuthenticatedUser({
          email: 'admin@vinci.be',
          admin: true,
        }),
      }),
    });

    expect(
      await screen.findByText(/impossible de charger les joueurs/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('affiche les admins en premier puis trie par tag', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      jsonResponse([
        {
          email: 'zeta-player@vinci.be',
          token: 'token-zeta',
          tag: 'Zeta',
          admin: false,
          profileImage: 'zeta.png',
        },
        {
          email: 'bravo-admin@vinci.be',
          token: 'token-bravo',
          tag: 'BravoAdmin',
          admin: true,
          profileImage: 'bravo.png',
        },
        {
          email: 'alpha-admin@vinci.be',
          token: 'token-alpha',
          tag: 'AlphaAdmin',
          admin: true,
          profileImage: 'alpha.png',
        },
        {
          email: 'beta-player@vinci.be',
          token: 'token-beta',
          tag: 'Beta',
          admin: false,
          profileImage: 'beta.png',
        },
      ]),
    );

    renderWithProviders(<AdminPage />, {
      userContext: createMockUserContext({
        authenticatedUser: createAuthenticatedUser({
          email: 'admin@vinci.be',
          admin: true,
        }),
      }),
    });

    await screen.findByText('AlphaAdmin');

    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderedTags = rows.map((row) =>
      row.querySelectorAll('td')[1]?.textContent?.trim(),
    );

    expect(orderedTags).toEqual(['AlphaAdmin', 'BravoAdmin', 'Beta', 'Zeta']);
  });

  it('place les comptes bannis en bas avec une mention visible', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      jsonResponse([
        {
          email: 'normal@vinci.be',
          token: 'token-normal',
          tag: 'Normal',
          admin: false,
          banned: false,
          profileImage: 'normal.png',
        },
        {
          email: 'ban@vinci.be',
          token: 'token-ban',
          tag: 'BannedUser',
          admin: false,
          banned: true,
          profileImage: 'ban.png',
        },
      ]),
    );

    renderWithProviders(<AdminPage />, {
      userContext: createMockUserContext({
        authenticatedUser: createAuthenticatedUser({
          email: 'admin@vinci.be',
          admin: true,
        }),
      }),
    });

    await screen.findByText('Normal');

    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderedTags = rows.map((row) =>
      row.querySelectorAll('td')[1]?.textContent?.trim(),
    );

    expect(orderedTags).toEqual(['Normal', 'BannedUser']);
    expect(screen.getByText(/joueur - banni/i)).toBeInTheDocument();
    expect(screen.getByText(/compte banni/i)).toBeInTheDocument();
  });
});
