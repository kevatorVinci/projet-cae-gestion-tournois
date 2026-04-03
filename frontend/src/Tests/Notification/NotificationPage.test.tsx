import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Notifications from '../../components/pages/Notifications/NotificationPage';
import {
  getCurrentUserIdFromToken,
  getNotificationsByUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/notifications';

// 1. Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actuel =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actuel, useNavigate: vi.fn() };
});

// 2. FIXED PATH: Mock notification services using the correct relative path (../../)
vi.mock('../../services/notifications', () => ({
  getCurrentUserIdFromToken: vi.fn(),
  getNotificationsByUser: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  markNotificationAsRead: vi.fn(),
}));

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
  {
    id: 4,
    idNotification: 4,
    message:
      "Accepté : ta demande pour rejoindre 'TEAM_ALPHA' a été acceptée. Bienvenue !",
    dateEnvoi: '2026-01-04T21:34:01',
    estLue: false,
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

    expect(await screen.findByText(/3 nouvelles/i)).toBeInTheDocument();
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
      undefined as void,
    );

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

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
    vi.mocked(markNotificationAsRead).mockResolvedValue(undefined as void);

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );

    const message = await screen.findByText(/bienvenue sur vinci arena/i);

    // Casting to HTMLElement for Type safety with within()
    const container = (message.closest('.MuiCardContent-root') ||
      message.parentElement) as HTMLElement;

    if (!container) throw new Error('Notification container not found');

    const readAction = within(container).getByText(/marquer comme lu/i);

    fireEvent.click(readAction);

    await waitFor(() => {
      expect(markNotificationAsRead).toHaveBeenCalledWith(1);
    });
  });

  test("affiche un lien vers Ma Team sur une notification d'acceptation", async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

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
      await screen.findByText(/accepté : ta demande pour rejoindre/i),
    ).toBeInTheDocument();

    const maTeamLink = screen.getByText(/voir ma team/i);
    fireEvent.click(maTeamLink);

    expect(mockNavigate).toHaveBeenCalledWith('/maTeam');
  });
});
