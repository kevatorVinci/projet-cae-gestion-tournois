import { useState } from 'react';
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
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

interface Notification {
  idNotification: number;
  type: string;
  title: string;
  message: string;
  reason?: string;
  dateEnvoi: string;
  estLue: boolean;
}

const TYPE_ACCENT: Record<string, string> = {
  success: '#22c55e',
  error: '#ef4444',
  event: '#e8822a',
  team: '#3b82f6',
  mail: '#e8822a',
};

export default function Notifications() {
  const [tab, setTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.estLue).length;

  const markAllRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, estLue: true })));
  };

  const markOneRead = (id: number) => {
    setNotifications((current) =>
      current.map((n) =>
        n.idNotification === id ? { ...n, estLue: true } : n,
      ),
    );
  };

  const deleteNotif = (id: number) => {
    setNotifications((current) =>
      current.filter((n) => n.idNotification !== id),
    );
  };

  const getActions = (n: Notification) => {
    switch (n.type) {
      case 'success':
        return [
          { label: 'Voir le classement', color: '#e8822a' },
          { label: 'Marquer comme lu', color: 'rgba(255,255,255,0.4)' },
        ];
      case 'event':
        return [
          { label: 'Voir le tournoi', color: '#e8822a' },
          { label: 'Supprimer', color: '#ef4444' },
        ];
      case 'team':
        return [
          { label: 'Voir mon équipe', color: '#e8822a' },
          { label: 'Supprimer', color: '#ef4444' },
        ];
      case 'error':
        return [{ label: 'Supprimer', color: '#ef4444' }];
      case 'mail':
        return [{ label: 'Supprimer', color: '#ef4444' }];
      default:
        return [{ label: 'Supprimer', color: '#ef4444' }];
    }
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
          {filtered.length === 0 && (
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

          {filtered.map((n) => {
            const accent = TYPE_ACCENT[n.type] ?? '#e8822a';
            const actions = getActions(n);
            return (
              <Card
                key={n.idNotification}
                sx={{
                  bgcolor: '#111827',
                  border: n.estLue
                    ? '1px solid rgba(255,255,255,0.07)'
                    : `1px solid ${accent}55`,
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: `${accent}99`,
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
                    bgcolor: accent,
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
                      bgcolor: accent,
                      boxShadow: `0 0 8px ${accent}`,
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
                      fontWeight={700}
                      sx={{
                        color: n.estLue ? 'rgba(255,255,255,0.6)' : 'white',
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
                    sx={{ mb: n.reason ? 0.5 : 1.5, lineHeight: 1.6 }}
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

                  <Box sx={{ display: 'flex', gap: 2.5 }}>
                    {actions.map((a, i) => (
                      <Typography
                        key={i}
                        variant="caption"
                        onClick={() => {
                          if (a.label === 'Supprimer')
                            deleteNotif(n.idNotification);
                          if (a.label === 'Marquer comme lu')
                            markOneRead(n.idNotification);
                        }}
                        sx={{
                          color: a.color,
                          cursor: 'pointer',
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          '&:hover': {
                            textDecoration: 'underline',
                            opacity: 0.8,
                          },
                        }}
                      >
                        {a.label}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
