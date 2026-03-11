import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { ExitToApp as LeaveIcon } from '@mui/icons-material';
import {
  depromoteResponsable,
  getUserTeam,
  isCurrentUserResponsable,
  leaveEquipe,
  promoteResponsable,
} from '../../../services/teams';
import { UserContext } from '../../../contexts/UserContext';
import { Equipe, UserContextType } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';

export function MyTeam() {
  const {}: UserContextType = useContext(UserContext);
  const navigate = useNavigate();
  const [team, setTeam] = useState<Equipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResponsable, setIsResponsable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<
    number | null
  >(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [replacementResponsibleId, setReplacementResponsibleId] = useState<
    number | null
  >(null);
  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);
  const [pendingPromoteMember, setPendingPromoteMember] = useState<{
    id: number;
    tag?: string;
  } | null>(null);

  const currentUserId = (() => {
    const token = getAuthenticatedUser()?.token;
    if (!token) return undefined;
    const payload = decodeJwtPayload(token);
    if (typeof payload?.id === 'number') return payload.id;
    const subAsNumber = Number(payload?.sub);
    return Number.isFinite(subAsNumber) ? subAsNumber : undefined;
  })();

  const handleAuthFailure = useCallback(
    (err: unknown): boolean => {
      const errorMessage = err instanceof Error ? err.message : '';
      if (
        errorMessage.includes('Session expiree') ||
        errorMessage.includes('Utilisateur non authentifie')
      ) {
        navigate('/login');
        return true;
      }
      return false;
    },
    [navigate],
  );

  const loadMyTeam = useCallback(async () => {
    try {
      const [myTeam, responsable] = await Promise.all([
        getUserTeam(),
        isCurrentUserResponsable(),
      ]);

      setTeam(myTeam);
      setIsResponsable(responsable);
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessage('Impossible de charger votre equipe pour le moment.');
    } finally {
      setLoading(false);
    }
  }, [handleAuthFailure]);

  useEffect(() => {
    loadMyTeam();
  }, [loadMyTeam]);

  const handleLeaveTeam = async () => {
    if (!team) {
      return;
    }

    const otherMembers = team.members.filter(
      (member) => member.id !== currentUserId,
    );

    if (isResponsable && otherMembers.length > 0) {
      setReplacementResponsibleId(null);
      setIsLeaveDialogOpen(true);
      return;
    }

    if (!window.confirm(`Etes-vous sur de vouloir quitter ${team.name} ?`)) {
      return;
    }

    try {
      await leaveEquipe();
      setTeam(null);
      setIsResponsable(false);
      setMessage('Vous avez quitte votre equipe.');
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessage(
        err instanceof Error
          ? err.message
          : "Impossible de quitter l'equipe actuellement.",
      );
    }
  };

  const handleConfirmLeaveTeam = async () => {
    if (!team) {
      return;
    }

    if (!replacementResponsibleId) {
      setMessage('Vous devez choisir un nouveau responsable avant de quitter.');
      return;
    }

    try {
      await leaveEquipe(undefined, replacementResponsibleId);
      setTeam(null);
      setIsResponsable(false);
      setIsLeaveDialogOpen(false);
      setReplacementResponsibleId(null);
      setMessage('Vous avez quitte votre equipe.');
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessage(
        err instanceof Error
          ? err.message
          : "Impossible de quitter l'equipe actuellement.",
      );
    }
  };

  const handlePromote = async (memberId: number, memberTag?: string) => {
    try {
      setMemberActionLoadingId(memberId);
      await promoteResponsable(memberId);
      await loadMyTeam();
      setMessage(`${memberTag || 'Le membre'} est maintenant responsable.`);
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessage(
        err instanceof Error
          ? err.message
          : 'Impossible de nommer ce membre responsable.',
      );
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const openPromoteConfirm = (memberId: number, memberTag?: string) => {
    setPendingPromoteMember({ id: memberId, tag: memberTag });
    setPromoteConfirmOpen(true);
  };

  const handleConfirmPromote = async () => {
    if (!pendingPromoteMember) {
      return;
    }
    setPromoteConfirmOpen(false);
    await handlePromote(pendingPromoteMember.id, pendingPromoteMember.tag);
    setPendingPromoteMember(null);
  };

  const handleDepromote = async (memberId: number, memberTag?: string) => {
    try {
      setMemberActionLoadingId(memberId);
      await depromoteResponsable(memberId);
      await loadMyTeam();
      setMessage(`${memberTag || 'Le membre'} n'est plus responsable.`);
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessage(
        err instanceof Error
          ? err.message
          : 'Impossible de deheriter ce responsable.',
      );
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!team) {
    return (
      <Box
        sx={{
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
          p: 3,
        }}
      >
        <Alert severity="info">Vous n&apos;etes dans aucune equipe.</Alert>
      </Box>
    );
  }

  const otherMembers = team.members.filter(
    (member) => member.id !== currentUserId,
  );

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ mb: 1 }}>
        {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}

        {/* 1. BANNIÈRE HEADER */}
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 2,
            bgcolor: '#1a2540',
            color: 'white',
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>
              Membre de l'équipe
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              {team.name}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                👥 {team.members.length} Membres
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1.5}>
            {isResponsable && (
              <Button
                variant="contained"
                onClick={() => navigate('/equipes/demande')}
                sx={{
                  bgcolor: '#e8822a',
                  color: 'white',
                  '&:hover': { bgcolor: '#c86e20' },
                }}
              >
                Demandes d'adhesion
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<LeaveIcon />}
              onClick={handleLeaveTeam}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { bgcolor: '#c86e20', borderColor: '#c86e20' },
              }}
            >
              Quitter l'equipe
            </Button>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: '#1a2540',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            color="white"
          >
            👥 Mes Coéquipiers
          </Typography>
          <List disablePadding>
            {team.members.map((member, index) => (
              <Box key={member.id}>
                <ListItem sx={{ py: 2, px: 0 }}>
                  <ListItemAvatar>
                    <Avatar
                      src={member.profileImageUrl || member.profileImage}
                      sx={{
                        width: 50,
                        height: 50,
                        border: '1px solid rgba(255,255,255,0.20)',
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>
                          <Typography
                            component="span"
                            fontWeight={700}
                            color="white"
                          >
                            {member.tag}{' '}
                            {member.id === currentUserId && '(Vous)'}
                          </Typography>
                        </Typography>
                        <Chip
                          label={
                            member.isResponsable ? 'Responsable' : 'Membre'
                          }
                          size="small"
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            bgcolor: member.isResponsable
                              ? '#e8822a'
                              : '#080b14',
                            color: 'white',
                          }}
                        />
                        {isResponsable && member.id !== currentUserId && (
                          <Button
                            size="small"
                            variant={
                              member.isResponsable ? 'outlined' : 'contained'
                            }
                            disabled={memberActionLoadingId === member.id}
                            onClick={() => {
                              const targetMemberId = member.id;
                              if (typeof targetMemberId !== 'number') {
                                return;
                              }

                              if (member.isResponsable) {
                                handleDepromote(targetMemberId, member.tag);
                              } else {
                                openPromoteConfirm(targetMemberId, member.tag);
                              }
                            }}
                            sx={{
                              textTransform: 'none',
                              fontSize: 11,
                              minWidth: 130,
                              bgcolor: member.isResponsable
                                ? 'transparent'
                                : '#e8822a',
                              color: 'white',
                              borderColor: 'rgba(255,255,255,0.35)',
                              '&:hover': {
                                bgcolor: member.isResponsable
                                  ? '#080b14'
                                  : '#c86e20',
                                borderColor: '#c86e20',
                              },
                            }}
                          >
                            {member.isResponsable
                              ? 'Deheriter'
                              : 'Nommer responsable'}
                          </Button>
                        )}
                      </Stack>
                    }
                    secondary={
                      <Chip
                        label={member.specialty || 'Membre'}
                        size="small"
                        variant="outlined"
                        sx={{
                          mt: 0.5,
                          fontSize: 11,
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.25)',
                        }}
                      />
                    }
                  />
                </ListItem>
                {index < team.members.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      </Container>

      <Dialog
        open={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Choisir un nouveau responsable</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Avant de quitter l'equipe, vous devez designer un autre responsable.
          </Typography>
          <RadioGroup
            value={replacementResponsibleId?.toString() || ''}
            onChange={(event) =>
              setReplacementResponsibleId(Number(event.target.value))
            }
          >
            {otherMembers.map((member) => (
              <FormControlLabel
                key={member.id}
                value={member.id?.toString() || ''}
                control={<Radio />}
                label={`${member.tag} (${member.specialty || 'Membre'})`}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsLeaveDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleConfirmLeaveTeam}
            disabled={!replacementResponsibleId}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={promoteConfirmOpen}
        onClose={() => {
          setPromoteConfirmOpen(false);
          setPendingPromoteMember(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmer la promotion</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment nommer{' '}
            <strong>{pendingPromoteMember?.tag || 'ce membre'}</strong>{' '}
            responsable ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPromoteConfirmOpen(false);
              setPendingPromoteMember(null);
            }}
          >
            Annuler
          </Button>
          <Button variant="contained" onClick={handleConfirmPromote}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
