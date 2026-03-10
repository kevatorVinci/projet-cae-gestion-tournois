import { useState, useEffect } from 'react';
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
  createTheme,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: { main: '#3b82f6' },
    secondary: { main: '#10b981' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
  },
});

interface Notification {
  idNotification: number;
  type: string;
  title: string;
  message: string;
  reason?: string;
  dateEnvoi: string;
  estLue: boolean;
}

export default function Notifications() {
  const [tab, setTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const idMembre = 1; // Replace with actual member ID from context or JWT
  const unreadCount = notifications.filter((n) => !n.estLue).length;

  useEffect(() => {
    axios
      .get<Notification[]>(
        `http://localhost:3000/api/notifications/membre/${idMembre}`,
      )
      .then((res) => {
        console.log('Please show me', res.data);
        setNotifications(res.data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Error fetching notifications:', err);
        setLoading(false);
      });
  }, [idMembre]);

  const markAllRead = () => {
    axios
      .patch(
        `http://localhost:3000/api/notifications/membre/${idMembre}/tous-lue`,
      )
      .then(() =>
        setNotifications(notifications.map((n) => ({ ...n, estLue: true }))),
      )
      .catch((err: unknown) => {
        console.error('Error marking all as read:', err);
      });
  };

  const markOneRead = (id: number) => {
    axios
      .patch(`http://localhost:3000/api/notifications/${id}/lue`)
      .then(() =>
        setNotifications(
          notifications.map((n) =>
            n.idNotification === id ? { ...n, estLue: true } : n,
          ),
        ),
      );
  };

  const deleteNotif = (id: number) => {
    axios
      .delete(`http://localhost:3000/api/notifications/${id}`)
      .then(() =>
        setNotifications(notifications.filter((n) => n.idNotification !== id)),
      );
  };

  // Derive actions based on type
  const getActions = (n: Notification) => {
    switch (n.type) {
      case 'success':
        return [
          { label: 'Voir le classement', color: 'secondary.main' },
          { label: 'Marquer comme lu', color: 'text.secondary' },
        ];
      case 'event':
        return [
          { label: 'Voir le tournoi', color: 'secondary.main' },
          { label: 'Supprimer', color: 'error.main' },
        ];
      case 'team':
        return [
          { label: 'Voir mon équipe', color: 'secondary.main' },
          { label: 'Supprimer', color: 'error.main' },
        ];
      case 'error':
        return [{ label: 'Supprimer', color: 'error.main' }];
      case 'mail':
        return [{ label: 'Supprimer', color: 'error.main' }];
      default:
        return [{ label: 'Supprimer', color: 'error.main' }];
    }
  };

  const filtered =
    tab === 0
      ? notifications
      : tab === 1
        ? notifications.filter((n) => !n.estLue)
        : notifications.filter((n) => n.estLue);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Chargement des notifications...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}>
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5">Notifications</Typography>
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
              sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
            >
              Tout marquer comme lu
            </Button>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              mb: 2,
              '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
              '& .Mui-selected': { color: 'text.primary !important' },
              '& .MuiTab-root': { color: 'text.secondary' },
            }}
          >
            <Tab
              label="Toutes"
              sx={{
                bgcolor: tab === 0 ? '#1e293b' : 'transparent',
                borderRadius: 2,
                mr: 0.5,
              }}
            />
            <Tab label="Non lues" />
            <Tab label="Historique" />
          </Tabs>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filtered.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4 }}
              >
                Aucune notification.
              </Typography>
            )}

            {filtered.map((n) => {
              const actions = getActions(n);
              return (
                <Card
                  key={n.idNotification}
                  sx={{
                    bgcolor: n.estLue ? 'background.paper' : '#1a2744',
                    border: n.estLue
                      ? '1px solid #334155'
                      : '1px solid #2d4a7a',
                    position: 'relative',
                  }}
                >
                  {!n.estLue && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#3b82f6',
                      }}
                    />
                  )}

                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              color:
                                n.type === 'mail'
                                  ? 'secondary.main'
                                  : 'text.primary',
                            }}
                          >
                            {n.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ flexShrink: 0, ml: 2 }}
                          >
                            {n.dateEnvoi}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: n.reason ? 0.5 : 1.5, lineHeight: 1.5 }}
                        >
                          {n.message}
                        </Typography>

                        {n.reason && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#ef4444', display: 'block', mb: 1.5 }}
                          >
                            {n.reason}
                          </Typography>
                        )}

                        {/* Action links */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {actions.map((a, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              onClick={() => {
                                if (a.label === 'Supprimer')
                                  deleteNotif(n.idNotification);
                                if (a.label === 'Marquer comme lu')
                                  markOneRead(n.idNotification);
                                // Add handlers for other actions as needed
                              }}
                              sx={{
                                color: a.color,
                                cursor: 'pointer',
                                fontWeight: 600,
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {a.label}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
