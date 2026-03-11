import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Chip,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { NotificationItem } from '../../../types';
import {
  getCurrentUserIdFromToken,
  getNotificationsByUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../../services/notifications';

export default function Notifications() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const unreadCount = notifications.filter((n) => !n.estLue).length;

  const loadNotifications = async (targetUserId: number) => {
    try {
      setError(null);
      const data = await getNotificationsByUser(targetUserId);
      setNotifications(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de recuperer les notifications.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const id = getCurrentUserIdFromToken();
      setUserId(id);
      loadNotifications(id);
    } catch (err: unknown) {
      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de recuperer l utilisateur connecte.',
      );
    }
  }, []);

  const markAllRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((current) =>
        current.map((n) => ({ ...n, estLue: true })),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de marquer toutes les notifications comme lues.',
      );
    }
  };

  const markOneRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((n) =>
          n.idNotification === id ? { ...n, estLue: true } : n,
        ),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de marquer la notification comme lue.',
      );
    }
  };

  const formatDate = (dateValue: string) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }
    return parsed.toLocaleString('fr-BE');
  };

  const isJoinRequestNotification = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('nouvelle demande') ||
      normalized.includes('souhaite rejoindre')
    );
  };

  const filtered =
    tab === 0
      ? notifications
      : tab === 1
        ? notifications.filter((n) => !n.estLue)
        : notifications.filter((n) => n.estLue);

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        py: 5,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(30,58,95,0.4), transparent)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NotificationsNoneIcon sx={{ color: '#e8822a', fontSize: 28 }} />
            <Typography
              variant="h5"
              color="white"
              sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 700 }}
            >
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} nouvelles`}
                size="small"
                sx={{
                  bgcolor: '#ef4444',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            )}
          </Box>
          <Button
            startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
            size="small"
            onClick={markAllRead}
            sx={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.8rem',
              '&:hover': { color: '#e8822a' },
            }}
          >
            Tout marquer comme lu
          </Button>
        </Box>

        <Box
          sx={{
            bgcolor: '#111827',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 2,
            mb: 3,
            px: 0.5,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              minHeight: 44,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.4)',
                minHeight: 44,
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: 1.5,
                mx: 0.3,
                my: 0.3,
                transition: 'all 0.2s',
              },
              '& .Mui-selected': {
                color: 'white !important',
                bgcolor: '#1a2540',
              },
            }}
          >
            <Tab label="Toutes" />
            <Tab label="Non lues" />
            <Tab label="Historique" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {loading && (
            <Alert severity="info">Chargement des notifications...</Alert>
          )}

          {!loading && filtered.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <NotificationsNoneIcon
                sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)' }}
              />
              <Typography variant="body2" color="text.secondary">
                Aucune notification.
              </Typography>
            </Box>
          )}

          {!loading &&
            filtered.map((n) => {
              return (
                <Card
                  key={n.idNotification}
                  sx={{
                    bgcolor: '#111827',
                    border: n.estLue
                      ? '1px solid rgba(255,255,255,0.07)'
                      : '1px solid rgba(232,130,42,0.45)',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: 'rgba(232,130,42,0.65)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      bgcolor: '#e8822a',
                      opacity: n.estLue ? 0.35 : 1,
                    }}
                  />

                  {!n.estLue && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#e8822a',
                        boxShadow: '0 0 8px rgba(232,130,42,0.8)',
                      }}
                    />
                  )}

                  <CardContent
                    sx={{ pl: 3, pr: 3, py: 2, '&:last-child': { pb: 2 } }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: n.estLue ? 'rgba(255,255,255,0.6)' : 'white',
                        }}
                      >
                        Notification
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ flexShrink: 0, ml: 2 }}
                      >
                        {formatDate(n.dateEnvoi)}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb:
                          n.estLue && !isJoinRequestNotification(n.message)
                            ? 0
                            : 1.5,
                        lineHeight: 1.6,
                      }}
                    >
                      {n.message}
                    </Typography>

                    {(isJoinRequestNotification(n.message) || !n.estLue) && (
                      <Box sx={{ display: 'flex', gap: 2.5 }}>
                        {isJoinRequestNotification(n.message) && (
                          <Typography
                            variant="caption"
                            onClick={() => navigate('/equipes/demande')}
                            sx={{
                              color: '#e8822a',
                              cursor: 'pointer',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                              '&:hover': {
                                textDecoration: 'underline',
                                opacity: 0.8,
                              },
                            }}
                          >
                            Voir les demandes d'adhésion
                          </Typography>
                        )}

                        <Typography
                          variant="caption"
                          onClick={() => markOneRead(n.idNotification)}
                          sx={{
                            color: 'rgba(255,255,255,0.75)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            display: n.estLue ? 'none' : 'inline',
                            '&:hover': {
                              textDecoration: 'underline',
                              opacity: 0.8,
                            },
                          }}
                        >
                          Marquer comme lu
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </Box>
      </Container>
    </Box>
  );
}
