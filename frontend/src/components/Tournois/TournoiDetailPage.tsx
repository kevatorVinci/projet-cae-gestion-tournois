import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import BackButton from '../BoutonRetour';
import { Tournoi } from '../../types';
import { getAuthenticatedUser } from '../../utils/session';

type EquipeLike = {
  id?: number;
  name?: string;
  nom?: string;
};

type InscriptionTournoi = {
  etat?: string;
  equipe?: EquipeLike;
};

type TournoiDetail = Tournoi & {
  inscriptions?: InscriptionTournoi[];
};

const formatDate = (dateValue: string) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }
  return parsedDate.toLocaleDateString('fr-BE');
};

const getEtatLabel = (etat: Tournoi['etat']) => {
  switch (etat) {
    case 'OUVERT':
      return 'Ouvert';
    case 'CLOTURE':
      return 'Clôturé';
    case 'EN_COURS':
      return 'En cours';
    case 'TERMINE':
      return 'Terminé';
    case 'ANNULE':
      return 'Annulé';
    default:
      return etat;
  }
};

const getEtatColor = (etat: Tournoi['etat']) => {
  switch (etat) {
    case 'EN_COURS':
      return '#e8822a';
    case 'OUVERT':
      return '#16a34a';
    case 'CLOTURE':
      return '#0ea5e9';
    case 'TERMINE':
      return '#64748b';
    case 'ANNULE':
      return '#ef4444';
    default:
      return '#64748b';
  }
};

const resolveTeamName = (inscription: InscriptionTournoi, index: number) => {
  return (
    inscription.equipe?.name ||
    inscription.equipe?.nom ||
    `Équipe inscrite #${index + 1}`
  );
};

const fetchTournoiById = async (id: string): Promise<TournoiDetail> => {
  const response = await fetch(`/api/tournois/${id}`);
  if (!response.ok) {
    throw new Error('Impossible de charger les détails du tournoi.');
  }
  return response.json();
};

const fetchAcceptedInscriptions = async (
  id: string,
): Promise<InscriptionTournoi[]> => {
  const token = getAuthenticatedUser()?.token;
  const response = await fetch(`/api/tournois/${id}/inscriptions/accepted`, {
    headers: token ? { Authorization: token } : {},
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
};

const TournoiDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [acceptedInscriptions, setAcceptedInscriptions] = useState<
    InscriptionTournoi[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Identifiant du tournoi manquant.');
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const [tournoiDetail, inscriptions] = await Promise.all([
          fetchTournoiById(id),
          fetchAcceptedInscriptions(id),
        ]);
        setTournoi(tournoiDetail);
        setAcceptedInscriptions(inscriptions);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger ce tournoi.',
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const teams = useMemo(() => {
    if (acceptedInscriptions.length > 0) {
      return acceptedInscriptions;
    }
    return tournoi?.inscriptions || [];
  }, [acceptedInscriptions, tournoi]);

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
        <CircularProgress sx={{ color: '#e8822a' }} />
      </Box>
    );
  }

  if (error || !tournoi) {
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
        <Alert severity="error">{error || 'Tournoi introuvable.'}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        backgroundColor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
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

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <BackButton />

        <Card
          sx={{
            mb: 3,
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={1.5}
            >
              <Typography variant="h4" fontWeight={800} color="white">
                {tournoi.nom}
              </Typography>
              <Chip
                label={getEtatLabel(tournoi.etat)}
                sx={{
                  backgroundColor: getEtatColor(tournoi.etat),
                  color: 'white',
                  fontWeight: 700,
                }}
              />
            </Stack>

            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {tournoi.description ||
                "Aucune description n'a encore été ajoutée pour ce tournoi."}
            </Typography>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Chip
                label={`Début: ${formatDate(tournoi.dateDebut)}`}
                sx={{ bgcolor: '#1a2540', color: 'white' }}
              />
              <Chip
                label={`Fin: ${formatDate(tournoi.dateFin)}`}
                sx={{ bgcolor: '#1a2540', color: 'white' }}
              />
              <Chip
                label={`Limite d'inscription: ${formatDate(
                  tournoi.dateLimiteInscription,
                )}`}
                sx={{ bgcolor: '#1a2540', color: 'white' }}
              />
              {tournoi.nombresParticipantsMax && (
                <Chip
                  label={`Max équipes: ${tournoi.nombresParticipantsMax}`}
                  sx={{ bgcolor: '#1a2540', color: 'white' }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <GroupsIcon sx={{ color: '#e8822a' }} />
              <Typography variant="h6" fontWeight={700} color="white">
                Équipes inscrites
              </Typography>
            </Stack>

            {teams.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucune équipe inscrite pour le moment.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {teams.map((inscription, index) => (
                  <Box
                    key={`${resolveTeamName(inscription, index)}-${index}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: '#1a2540', color: 'white' }}>
                        {resolveTeamName(inscription, index)
                          .charAt(0)
                          .toUpperCase()}
                      </Avatar>
                      <Typography color="white" fontWeight={600}>
                        {resolveTeamName(inscription, index)}
                      </Typography>
                    </Stack>
                    {inscription.etat && (
                      <Chip
                        size="small"
                        label={inscription.etat}
                        sx={{ bgcolor: '#1a2540', color: 'white' }}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Astuce: cliquez sur retour pour revenir à la liste des tournois.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default TournoiDetailPage;
