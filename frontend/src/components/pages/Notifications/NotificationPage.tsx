import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../BackButton';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import EventIcon from '@mui/icons-material/Event';
import { NotificationItem } from '../../../types';
import { getAuthenticatedUser } from '../../../utils/session';
import {
  getCurrentUserIdFromToken,
  getNotificationsByUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../../services/notifications';
import {
  fetchAllTournaments,
  fetchPublicTournaments,
} from '../../../services/tournaments';

type NotifType =
  | 'demande'
  | 'accepte'
  | 'refus'
  | 'equipe'
  | 'bienvenue'
  | 'admin'
  | 'tournoi';

interface NotifMeta {
  type: NotifType;
  color: string;
  leftBar: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}

const getNotifMeta = (message: string): NotifMeta => {
  const m = message.toLowerCase();

  if (m.startsWith('accepté :')) {
    return {
      type: 'accepte',
      color: '#22c55e',
      leftBar: '#22c55e',
      border: 'rgba(34,197,94,0.45)',
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#22c55e' }} />,
      label: 'Accepté',
    };
  }

  if (m.startsWith('refus :')) {
    return {
      type: 'refus',
      color: '#ef4444',
      leftBar: '#ef4444',
      border: 'rgba(239,68,68,0.45)',
      icon: <CancelOutlinedIcon sx={{ fontSize: 16, color: '#ef4444' }} />,
      label: 'Refus',
    };
  }

  if (m.startsWith('nouvelle demande :') || m.startsWith('demande envoyée :')) {
    return {
      type: 'demande',
      color: '#3b82f6',
      leftBar: '#3b82f6',
      border: 'rgba(59,130,246,0.45)',
      icon: <GroupAddIcon sx={{ fontSize: 16, color: '#3b82f6' }} />,
      label: 'Demande',
    };
  }

  if (m.startsWith('équipe créée :') || m.startsWith('équipe :')) {
    return {
      type: 'equipe',
      color: '#a78bfa',
      leftBar: '#a78bfa',
      border: 'rgba(167,139,250,0.45)',
      icon: <EmojiEventsIcon sx={{ fontSize: 16, color: '#a78bfa' }} />,
      label: 'Équipe',
    };
  }

  if (m.startsWith('admin :')) {
    return {
      type: 'admin',
      color: '#f59e0b',
      leftBar: '#f59e0b',
      border: 'rgba(245,158,11,0.45)',
      icon: <SecurityIcon sx={{ fontSize: 16, color: '#f59e0b' }} />,
      label: 'Admin',
    };
  }

  if (m.startsWith('nouveau tournoi :')) {
    return {
      type: 'tournoi',
      color: '#06b6d4',
      leftBar: '#06b6d4',
      border: 'rgba(6,182,212,0.45)',
      icon: <EventIcon sx={{ fontSize: 16, color: '#06b6d4' }} />,
      label: 'Tournoi',
    };
  }

  return {
    type: 'bienvenue',
    color: '#e8822a',
    leftBar: '#e8822a',
    border: 'rgba(232,130,42,0.45)',
    icon: <InfoOutlinedIcon sx={{ fontSize: 16, color: '#e8822a' }} />,
    label: 'Bienvenue',
  };
};

export default function Notifications() {
  const navigate = useNavigate();
  const isAdmin = Boolean(getAuthenticatedUser()?.admin);
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState<
    'tous' | 'demande' | 'accepte' | 'refus' | 'equipe' | 'admin' | 'tournoi'
  >('tous');
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
      normalized.startsWith('nouvelle demande :') ||
      normalized.startsWith('demande envoyée :')
    );
  };

  const isAcceptedNotification = (message: string) =>
    message.toLowerCase().startsWith('accepté :');

  const isDraftTournamentNotification = (message: string) =>
    message.toLowerCase().startsWith('admin : nouveau tournoi en brouillon');

  const isPublishedTournamentNotification = (message: string) =>
    message.toLowerCase().startsWith('nouveau tournoi :');

  const extractTournamentName = (message: string) => {
    const match = message.match(/'([^']+)'/);
    return match?.[1] ?? null;
  };

  const redirectToTournamentFromNotification = async (message: string) => {
    const tournoiName = extractTournamentName(message);
    if (!tournoiName) {
      setError('Impossible de trouver le tournoi lié à cette notification.');
      return;
    }

    try {
      const isDraft = isDraftTournamentNotification(message);
      const isPublished = isPublishedTournamentNotification(message);
      const currentUser = getAuthenticatedUser();

      if (currentUser?.admin && currentUser.token) {
        const allTournaments = await fetchAllTournaments(currentUser.token);
        const target = allTournaments.find(
          (t: { id: number; nom: string }) => t.nom === tournoiName,
        );

        if (!target) {
          setError('Tournoi introuvable pour cette notification.');
          return;
        }

        if (isDraft) {
          navigate(`/admin/tournaments/edit/${target.id}`);
          return;
        }

        if (isPublished) {
          navigate(`/tournois/${target.id}`);
          return;
        }
      }

      const publicTournaments = await fetchPublicTournaments(
        undefined,
        tournoiName,
      );
      const target = publicTournaments.find(
        (t: { id: number; nom: string }) => t.nom === tournoiName,
      );

      if (!target) {
        setError('Tournoi public introuvable pour cette notification.');
        return;
      }

      navigate(`/tournois/${target.id}`);
    } catch {
      setError('Impossible de rediriger vers ce tournoi pour le moment.');
    }
  };

  const byTab =
    tab === 0
      ? notifications
      : tab === 1
        ? notifications.filter((n) => !n.estLue)
        : notifications.filter((n) => n.estLue);

  const filtered =
    typeFilter === 'tous'
      ? byTab
      : byTab.filter((n) => getNotifMeta(n.message).type === typeFilter);

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
            <BackButton />
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
            mb: 2,
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

        <FormControl
          size="small"
          sx={{
            mb: 3,
            minWidth: 220,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
              '&:hover fieldset': { borderColor: 'rgba(232,130,42,0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#e8822a' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#e8822a' },
            '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)' },
          }}
        >
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) =>
              setTypeFilter(
                e.target.value as
                  | 'tous'
                  | 'demande'
                  | 'accepte'
                  | 'refus'
                  | 'equipe'
                  | 'admin'
                  | 'tournoi',
              )
            }
            renderValue={(selected) => {
              if (selected === 'demande') {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupAddIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                    <span>Demandes</span>
                  </Box>
                );
              }

              if (selected === 'accepte') {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 18, color: '#22c55e' }}
                    />
                    <span>Acceptées</span>
                  </Box>
                );
              }

              if (selected === 'refus') {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CancelOutlinedIcon
                      sx={{ fontSize: 18, color: '#ef4444' }}
                    />
                    <span>Refusées</span>
                  </Box>
                );
              }

              if (selected === 'equipe') {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
                    <span>Équipe</span>
                  </Box>
                );
              }

              if (selected === 'admin' && isAdmin) {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                    <span>Admin</span>
                  </Box>
                );
              }

              if (selected === 'tournoi') {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon sx={{ fontSize: 18, color: '#06b6d4' }} />
                    <span>Tournoi</span>
                  </Box>
                );
              }

              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsNoneIcon
                    sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}
                  />
                  <span>Tous</span>
                </Box>
              );
            }}
            MenuProps={{
              PaperProps: {
                sx: { bgcolor: '#1a2540', color: 'white' },
              },
            }}
          >
            <MenuItem value="tous">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsNoneIcon
                  sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}
                />
                <span>Tous</span>
              </Box>
            </MenuItem>

            <MenuItem value="demande">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupAddIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                <span>Demandes</span>
              </Box>
            </MenuItem>

            <MenuItem value="accepte">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlineIcon
                  sx={{ fontSize: 18, color: '#22c55e' }}
                />
                <span>Acceptées</span>
              </Box>
            </MenuItem>

            <MenuItem value="refus">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CancelOutlinedIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                <span>Refusées</span>
              </Box>
            </MenuItem>

            <MenuItem value="equipe">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
                <span>Équipe</span>
              </Box>
            </MenuItem>

            {isAdmin && (
              <MenuItem value="admin">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                  <span>Admin</span>
                </Box>
              </MenuItem>
            )}

            <MenuItem value="tournoi">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon sx={{ fontSize: 18, color: '#06b6d4' }} />
                <span>Tournoi</span>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

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
              const meta = getNotifMeta(n.message);
              const isDemandeResponsable = n.message
                .toLowerCase()
                .startsWith('nouvelle demande :');
              const isTournamentNotification =
                isDraftTournamentNotification(n.message) ||
                isPublishedTournamentNotification(n.message);

              return (
                <Card
                  key={n.idNotification}
                  sx={{
                    bgcolor: '#111827',
                    border: n.estLue
                      ? '1px solid rgba(255,255,255,0.07)'
                      : `1px solid ${meta.border}`,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                    '&:hover': { borderColor: meta.border },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      bgcolor: meta.leftBar,
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
                        bgcolor: meta.color,
                        boxShadow: `0 0 8px ${meta.color}cc`,
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
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                        }}
                      >
                        {meta.icon}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: n.estLue
                              ? 'rgba(255,255,255,0.6)'
                              : meta.color,
                          }}
                        >
                          {meta.label}
                        </Typography>
                      </Box>

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
                          isJoinRequestNotification(n.message) || !n.estLue
                            ? 1.5
                            : 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {n.message}
                    </Typography>

                    {(isJoinRequestNotification(n.message) ||
                      isAcceptedNotification(n.message) ||
                      isTournamentNotification ||
                      !n.estLue) && (
                      <Box sx={{ display: 'flex', gap: 2.5 }}>
                        {isTournamentNotification && (
                          <Typography
                            variant="caption"
                            onClick={() =>
                              redirectToTournamentFromNotification(n.message)
                            }
                            sx={{
                              color: '#06b6d4',
                              cursor: 'pointer',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                              '&:hover': {
                                textDecoration: 'underline',
                                opacity: 0.8,
                              },
                            }}
                          >
                            Voir le tournoi
                          </Typography>
                        )}

                        {isAcceptedNotification(n.message) && (
                          <Typography
                            variant="caption"
                            onClick={() => navigate('/maTeam')}
                            sx={{
                              color: '#22c55e',
                              cursor: 'pointer',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                              '&:hover': {
                                textDecoration: 'underline',
                                opacity: 0.8,
                              },
                            }}
                          >
                            Voir ma team
                          </Typography>
                        )}

                        {isDemandeResponsable && (
                          <Typography
                            variant="caption"
                            onClick={() => navigate('/equipes/demande')}
                            sx={{
                              color: '#3b82f6',
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

                        {!n.estLue && (
                          <Typography
                            variant="caption"
                            onClick={() =>
                              markOneRead(
                                n.idNotification ??
                                  (n as unknown as { id: number }).id,
                              )
                            }
                            sx={{
                              color: 'rgba(255,255,255,0.75)',
                              cursor: 'pointer',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                              '&:hover': {
                                textDecoration: 'underline',
                                opacity: 0.8,
                              },
                            }}
                          >
                            Marquer comme lu
                          </Typography>
                        )}
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
