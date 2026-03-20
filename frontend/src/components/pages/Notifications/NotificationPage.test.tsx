import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Notifications from './NotificationPage';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actuel = await vi.importActual('react-router-dom');
  return { ...actuel, useNavigate: vi.fn() };
});

// Mock notification services
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
    id: 1,
    idNotification: 1,
    message: 'Bienvenue sur Vinci Arena !',
    dateEnvoi: '2026-01-01T10:00:00',
    estLue: false,
  },
  {
    id: 2,
    idNotification: 2,
    message: 'Nouvelle demande : joueur souhaite rejoindre votre équipe.',
    dateEnvoi: '2026-01-02T12:00:00',
    estLue: false,
  },
  {
    id: 3,
    idNotification: 3,
    message: 'Votre profil a été mis à jour.',
    dateEnvoi: '2026-01-03T09:00:00',
    estLue: true,
  },
];

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    expect(
      await screen.findByText(/bienvenue sur vinci arena/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/votre profil a été mis à jour/i),
    ).toBeInTheDocument();
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

    expect(await screen.findByText(/2 nouvelles/i)).toBeInTheDocument();
  });

  test('affiche un message si aucune notification', async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/aucune notification/i)).toBeInTheDocument();
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

    expect(await screen.findByText(/erreur serveur/i)).toBeInTheDocument();
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

    await screen.findByText(/bienvenue sur vinci arena/i);
    fireEvent.click(screen.getByRole('tab', { name: /non lues/i }));

    expect(
      screen.queryByText(/votre profil a été mis à jour/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/bienvenue sur vinci arena/i)).toBeInTheDocument();
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

    await screen.findByText(/votre profil a été mis à jour/i);
    fireEvent.click(screen.getByRole('tab', { name: /historique/i }));

    expect(
      screen.getByText(/votre profil a été mis à jour/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/bienvenue sur vinci arena/i),
    ).not.toBeInTheDocument();
  });

  test('appelle markAllNotificationsAsRead au clic sur tout marquer comme lu', async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce(
      notificationsSimulees,
    );
    vi.mocked(markAllNotificationsAsRead).mockResolvedValueOnce(
      undefined as any,
    );

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    // Using findByText since the output shows "Tout marquer comme lu" is likely not a button role either
    const btnAll = await screen.findByText(/tout marquer comme lu/i);
    fireEvent.click(btnAll);

    await waitFor(() => {
      expect(markAllNotificationsAsRead).toHaveBeenCalledWith(1);
    });
  });

  test('appelle markNotificationAsRead au clic sur marquer comme lu', async () => {
    vi.mocked(getCurrentUserIdFromToken).mockReturnValue(1);
    vi.mocked(getNotificationsByUser).mockResolvedValueOnce(
      notificationsSimulees,
    );
    vi.mocked(markNotificationAsRead).mockResolvedValue(undefined as any);

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    // 1. Find the text of the notification
    const message = await screen.findByText(/bienvenue sur vinci arena/i);

    // 2. Locate the container
    const container =
      message.closest('.MuiCardContent-root') || message.parentElement;
    if (!container) throw new Error('Notification container not found');

    // 3. Find the text "Marquer comme lu" inside that container and click it
    // We use getByText because it's a <span>, not a button
    const readAction = within(container).getByText(/marquer comme lu/i);

    fireEvent.click(readAction);

    // 4. Verify call with ID 1
    await waitFor(() => {
      expect(markNotificationAsRead).toHaveBeenCalledWith(1);
    });
  });
});
