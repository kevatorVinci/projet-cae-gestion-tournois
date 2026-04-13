import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCurrentUserIdFromToken,
  getNotificationsByUser,
  getUnreadNotificationsByUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications';

// Create mocks for session utilities
const mockGetAuthenticatedUser = vi.fn();
const mockDecodeJwtPayload = vi.fn();

vi.mock('../utils/session', () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
  decodeJwtPayload: (token: string) => mockDecodeJwtPayload(token),
}));

describe('notifications service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Stub global fetch
    vi.stubGlobal('fetch', vi.fn());
    mockGetAuthenticatedUser.mockReset();
    mockDecodeJwtPayload.mockReset();
  });

  it('getCurrentUserIdFromToken returns the payload id', () => {
    mockGetAuthenticatedUser.mockReturnValue({ token: 'tkn' });
    mockDecodeJwtPayload.mockReturnValue({ id: 42 });

    expect(getCurrentUserIdFromToken()).toBe(42);
  });

  it('getCurrentUserIdFromToken throws when session is missing', () => {
    mockGetAuthenticatedUser.mockReturnValue(undefined);

    expect(() => getCurrentUserIdFromToken()).toThrow(
      /session expiree|expire/i,
    );
  });

  it('getCurrentUserIdFromToken throws when payload has no id', () => {
    mockGetAuthenticatedUser.mockReturnValue({ token: 'tkn' });
    mockDecodeJwtPayload.mockReturnValue({});

    expect(() => getCurrentUserIdFromToken()).toThrow(
      /impossible de recuperer l utilisateur connecte/i,
    );
  });

  it('getNotificationsByUser returns notifications', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ token: 'secure' });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ idNotification: 1, message: 'ok', estLue: false }]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await getNotificationsByUser(10);

    // According to current behavior, this function does NOT send "Bearer "
    expect(fetch).toHaveBeenCalledWith(
      '/api/notifications/users/10',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'secure' }),
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('getUnreadNotificationsByUser returns unread notifications', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ token: 'secure' });
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([{ idNotification: 2, message: 'new', estLue: false }]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await getUnreadNotificationsByUser(3);

    // According to current behavior, this function does NOT send "Bearer " either
    expect(fetch).toHaveBeenCalledWith(
      '/api/notifications/users/3/non-lues',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'secure' }),
      }),
    );
    expect(result[0].idNotification).toBe(2);
  });

  it('getNotificationsByUser surfaces backend error message', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ token: 'secure' });
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'backend failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(getNotificationsByUser(1)).rejects.toThrow(/backend failed/i);
  });

  it('markNotificationAsRead sends an authenticated PATCH', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ token: 'secure' });
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await markNotificationAsRead(99);

    // According to current behavior, this function DOES send "Bearer "
    expect(fetch).toHaveBeenCalledWith(
      '/api/notifications/99/lue',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: 'Bearer secure' }),
      }),
    );
  });

  it('markAllNotificationsAsRead uses fallback message when body is not JSON', async () => {
    mockGetAuthenticatedUser.mockReturnValue({ token: 'secure' });
    vi.mocked(fetch).mockResolvedValue(
      new Response('server error', { status: 500 }),
    );

    await expect(markAllNotificationsAsRead(4)).rejects.toThrow(
      /impossible de marquer toutes les notifications comme lues/i,
    );
  });
});
