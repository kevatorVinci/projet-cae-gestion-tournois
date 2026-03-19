import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import Notifications from './NotificationPage';

vi.mock('react-router-dom', async () => {
  const actuel = await vi.importActual('react-router-dom');
  return { ...actuel, useNavigate: vi.fn() };
});

// On simule les services de notifications pour ne pas faire de vraies requêtes
vi.mock('../../../services/notifications', () => ({
  getCurrentUserIdFromToken: vi.fn(),
  getNotificationsByUser: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  markNotificationAsRead: vi.fn(),
}));

import {
  getCurrentUserIdFromToken,
  getNotificationsByUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../../services/notifications';

const notificationsSimulees = [
  {
    idNotification: 1,
    message: 'Bienvenue sur Vinci Arena !',
    dateEnvoi: '2026-01-01T10:00:00',
    estLue: false,
  },
  {
    idNotification: 2,
    message: 'Nouvelle demande : joueur souhaite rejoindre votre équipe.',
    dateEnvoi: '2026-01-02T12:00:00',
    estLue: false,
  },
  {
    idNotification: 3,
    message: 'Votre profil a été mis à jour.',
    dateEnvoi: '2026-01-03T09:00:00',
    estLue: true,
  },
];

describe('Notifications', () => {
  test("affiche les notifications chargées depuis l'API", async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce(
      notificationsSimulees,
    );

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/bienvenue sur vinci arena/i)).toBeDefined();
      expect(screen.getByText(/votre profil a été mis à jour/i)).toBeDefined();
    });
  });

  test('affiche le nombre de notifications non lues', async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce(
      notificationsSimulees,
    );

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    // 2 notifications non lues dans nos données simulées
    await waitFor(() => {
      expect(screen.getByText(/2 nouvelles/i)).toBeDefined();
    });
  });

  test('affiche un message si aucune notification', async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/aucune notification/i)).toBeDefined();
    });
  });

  test("affiche une erreur si l'API échoue", async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockRejectedValueOnce(
      new Error('Erreur serveur'),
    );

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/erreur serveur/i)).toBeDefined();
    });
  });

  test("filtre les notifications non lues avec l'onglet Non lues", async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce(
      notificationsSimulees,
    );

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/bienvenue sur vinci arena/i)).toBeDefined();
    });

    // On clique sur l'onglet "Non lues"
    fireEvent.click(screen.getByRole('tab', { name: /non lues/i }));

    await waitFor(() => {
      // La notification lue ne doit plus apparaître
      expect(screen.queryByText(/votre profil a été mis à jour/i)).toBeNull();
      expect(screen.getByText(/bienvenue sur vinci arena/i)).toBeDefined();
    });
  });

  test("filtre les notifications lues avec l'onglet Historique", async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce(
      notificationsSimulees,
    );

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/votre profil a été mis à jour/i)).toBeDefined();
    });

    // On clique sur l'onglet "Historique"
    fireEvent.click(screen.getByRole('tab', { name: /historique/i }));

    await waitFor(() => {
      expect(screen.getByText(/votre profil a été mis à jour/i)).toBeDefined();
      expect(screen.queryByText(/bienvenue sur vinci arena/i)).toBeNull();
    });
  });

  test('appelle markAllNotificationsAsRead au clic sur tout marquer comme lu', async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce(
      notificationsSimulees,
    );
    vi.mocked(markAllNotificationsAsRead).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/bienvenue sur vinci arena/i)).toBeDefined();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /tout marquer comme lu/i }),
    );

    await waitFor(() => {
      expect(markAllNotificationsAsRead).toHaveBeenCalledWith(1);
    });
  });

  test('appelle markNotificationAsRead au clic sur marquer comme lu', async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce(
      notificationsSimulees,
    );
    vi.mocked(markNotificationAsRead).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/bienvenue sur vinci arena/i)).toBeDefined();
    });

    // On clique sur "Marquer comme lu" de la première notification non lue
    const boutons = screen.getAllByText(/marquer comme lu/i);
    fireEvent.click(boutons[0]);

    await waitFor(() => {
      expect(markNotificationAsRead).toHaveBeenCalledWith(1);
    });
  });
});
