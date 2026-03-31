import { useCallback, useEffect, useState } from 'react';
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
import {
  ExitToApp as LeaveIcon,
  EmojiEvents,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  depromoteResponsable,
  getUserTeam,
  isCurrentUserResponsable,
  leaveEquipe,
  promoteResponsable,
  updateTeamImage, // ✨ IMPORT NEW FUNCTION
} from '../../../services/teams';
import { Equipe } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { decodeJwtPayload, getAuthenticatedUser } from '../../../utils/session';

export function MyTeam() {
  const navigate = useNavigate();
  const [team, setTeam] = useState<Equipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResponsable, setIsResponsable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<
    number | null
  >(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isSimpleLeaveDialogOpen, setIsSimpleLeaveDialogOpen] = useState(false);
  const [replacementResponsibleId, setReplacementResponsibleId] = useState<
    number | null
  >(null);
  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);
  const [pendingPromoteMember, setPendingPromoteMember] = useState<{
    id: number;
    tag?: string;
  } | null>(null);

  // ✨ NEW STATE FOR IMAGE UPDATING
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const teamImages = [
    'akatsuki.jpg',
    'espada.jpg',
    'fairytail.jpg',
    'hunter.jpg',
    'onepiece.jpg',
  ];
  const [selectedNewImage, setSelectedNewImage] = useState(teamImages[0]);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

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
      setMessage('Impossible de charger votre équipe pour le moment.');
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
    const responsablesCount = team.members.filter(
      (member) => member.isResponsable,
    ).length;
    const mustChooseReplacement = isResponsable && responsablesCount === 1;

    if (mustChooseReplacement && otherMembers.length > 0) {
      setReplacementResponsibleId(null);
      setIsLeaveDialogOpen(true);
      return;
    }

    setIsSimpleLeaveDialogOpen(true);
  };

  const handleConfirmSimpleLeaveTeam = async () => {
    if (!team) {
      return;
    }

    try {
      await leaveEquipe();
      setTeam(null);
      setIsResponsable(false);
      setIsSimpleLeaveDialogOpen(false);
      setMessage('Vous avez quitté votre équipe.');
      window.dispatchEvent(new Event('team-membership-changed'));
      navigate('/equipes');
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessage(
        err instanceof Error
          ? err.message
          : "Impossible de quitter l'équipe actuellement.",
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
      setMessage('Vous avez quitté votre équipe.');
      window.dispatchEvent(new Event('team-membership-changed'));
      navigate('/equipes');
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) {
        return;
      }
      setMessage(
        err instanceof Error
          ? err.message
          : "Impossible de quitter l'équipe actuellement.",
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

  const handleUpdateImage = async () => {
    if (!team) return;
    setIsUpdatingImage(true);
    try {
      await updateTeamImage(team.id, selectedNewImage);
      await loadMyTeam(); // Refresh team info after update
      setMessage("L'emblème de l'équipe a été mis à jour avec succès ! 🛡️");
      setIsImageDialogOpen(false);
    } catch (err: unknown) {
      console.error('Erreur API :', err);
      if (handleAuthFailure(err)) return;
      setMessage(
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de l'image.",
      );
    } finally {
      setIsUpdatingImage(false);
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
        <Alert severity="info">Vous n&apos;êtes dans aucune équipe.</Alert>
      </Box>
    );
  }

  const otherMembers = team.members.filter(
    (member) => member.id !== currentUserId,
  );
  const responsablesCount = team.members.filter(
    (member) => member.isResponsable,
  ).length;
  const canPromoteMore = responsablesCount < 2;
  const sortedMembers = [...team.members].sort((a, b) => {
    const aResponsable = a.isResponsable ? 1 : 0;
    const bResponsable = b.isResponsable ? 1 : 0;
    if (aResponsable !== bResponsable) {
      return bResponsable - aResponsable;
    }

    const aTag = (a.tag || '').trim();
    const bTag = (b.tag || '').trim();
    const byTag = aTag.localeCompare(bTag, 'fr', {
      sensitivity: 'base',
    });
    if (byTag !== 0) {
      return byTag;
    }

    return (a.id || 0) - (b.id || 0);
  });

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

        {/* 1. BANNIÈRE HEAD */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 📸 TEAM IMAGE AND EDIT BUTTON */}
            <Box sx={{ position: 'relative' }}>
              {team.profileImage && (
                <Avatar
                  src={`/${team.profileImage}`}
                  alt={team.name}
                  variant="rounded"
                  sx={{
                    width: 90,
                    height: 90,
                    border: '3px solid #e8822a',
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                  }}
                />
              )}
              {isResponsable && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setIsImageDialogOpen(true)}
                  sx={{
                    position: 'absolute',
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#1a2540',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    minWidth: 'auto',
                    p: 0.5,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#e8822a' },
                  }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </Button>
              )}
            </Box>

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
          </Box>

          <Stack direction="row" spacing={1.5}>
            {isResponsable && (
              <>
                <Button
                  variant="contained"
                  onClick={() => navigate('/equipes/demande')}
                  sx={{
                    bgcolor: '#e8822a',
                    color: 'white',
                    '&:hover': { bgcolor: '#c86e20' },
                  }}
                >
                  Demandes d'adhésion
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EmojiEvents />}
                  onClick={() => navigate('/tournois/gestion')}
                  sx={{
                    bgcolor: '#22c55e',
                    color: 'white',
                    '&:hover': { bgcolor: '#16a34a' },
                  }}
                >
                  Gérer les Tournois
                </Button>
              </>
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
              Quitter l'équipe
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
            {sortedMembers.map((member, index) => (
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
                            onClick={() => {
                              navigate(`/players/${member.id}`);
                            }}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { color: '#e8822a' },
                            }}
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
                        {isResponsable &&
                          member.id !== currentUserId &&
                          (member.isResponsable || canPromoteMore) && (
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
                                  openPromoteConfirm(
                                    targetMemberId,
                                    member.tag,
                                  );
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
                                ? 'Retirer le rôle de responsable'
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
                {index < sortedMembers.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      </Container>

      {/* ✨ DIALOG FOR UPDATING THE TEAM IMAGE ✨ */}
      <Dialog
        open={isImageDialogOpen}
        onClose={() => !isUpdatingImage && setIsImageDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{ color: 'white', fontWeight: 700, textAlign: 'center' }}
        >
          Modifier l'emblème de l'équipe
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
              mt: 2,
            }}
          >
            {teamImages.map((img) => (
              <Box
                key={img}
                component="img"
                src={`/${img}`}
                alt={`Emblème ${img}`}
                onClick={() => setSelectedNewImage(img)}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border:
                    selectedNewImage === img
                      ? '3px solid #e8822a'
                      : '3px solid transparent',
                  opacity: selectedNewImage === img ? 1 : 0.5,
                  transition: 'all 0.2s ease-in-out',
                  objectFit: 'cover',
                  '&:hover': { transform: 'scale(1.1)', opacity: 1 },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', mt: 2, pb: 2 }}>
          <Button
            onClick={() => setIsImageDialogOpen(false)}
            disabled={isUpdatingImage}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.35)',
              mr: 2,
              '&:hover': { bgcolor: '#080b14' },
            }}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateImage}
            disabled={isUpdatingImage || selectedNewImage === team.profileImage}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            {isUpdatingImage ? 'Modification...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSimpleLeaveDialogOpen}
        onClose={() => setIsSimpleLeaveDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          Quitter l&apos;équipe
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Êtes-vous sûr de vouloir quitter {team.name} ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsSimpleLeaveDialogOpen(false)}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.35)',
              '&:hover': {
                bgcolor: '#080b14',
                borderColor: '#c86e20',
              },
            }}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSimpleLeaveTeam}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
            }}
          >
            Quitter
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#1a2540',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          Choisir un nouveau responsable
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} color="text.secondary">
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
                control={
                  <Radio
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      '&.Mui-checked': { color: '#e8822a' },
                    }}
                  />
                }
                label={`${member.tag} (${member.specialty || 'Membre'})`}
                sx={{ color: 'white' }}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsLeaveDialogOpen(false)}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.35)',
              '&:hover': {
                bgcolor: '#080b14',
                borderColor: '#c86e20',
              },
            }}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmLeaveTeam}
            disabled={!replacementResponsibleId}
            sx={{
              bgcolor: '#e8822a',
              color: 'white',
              '&:hover': { bgcolor: '#c86e20' },
            }}
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
