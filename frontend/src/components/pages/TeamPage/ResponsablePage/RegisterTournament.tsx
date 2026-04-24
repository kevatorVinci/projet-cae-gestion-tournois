import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BackButton from '../../../BackButton';
import {
  fetchMatchSelections,
  fetchTeamRegistrations,
  fetchTeamMatches,
  fetchTeamSelectionEditor,
  fetchTournamentMatches,
  fetchTournamentById,
  TeamMatch,
} from '../../../../services/tournaments';
import { getUserTeam } from '../../../../services/teams';
import { getAuthenticatedUser } from '../../../../utils/session';

type SelectionStatusFilter = 'ALL' | 'TO_COMPLETE' | 'COMPLETE';
type TournamentStateFilter =
  | 'ALL'
  | 'OUVERT'
  | 'CLOTURE'
  | 'EN_COURS'
  | 'TERMINE'
  | 'ANNULE';
type MatchStateFilter = 'ALL' | 'NOT_FINISHED' | 'FINISHED';

type MatchSelectionRow = {
  match: TeamMatch;
  tournamentName: string;
  tournamentEtat: string;
  canEdit: boolean;
  selectedCount: number;
  maxPlayers: number | null;
};

const normalize = (value?: string): string =>
  (value || '').trim().toLowerCase();

const isFinishedMatch = (match: TeamMatch): boolean => {
  const status = normalize(match.status);
  const hasScore =
    typeof match.scoreTeam1 === 'number' &&
    typeof match.scoreTeam2 === 'number';

  if (hasScore) return true;

  return (
    status === 'termine' ||
    status === 'finished' ||
    status === 'completed' ||
    status === 'complete' ||
    status === 'disputed' ||
    status === 'waiting_validation'
  );
};

const formatDateTime = (value?: string): string => {
  if (!value) return 'Date non définie';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Style partagé pour les inputs de date et texte (dark theme)
const darkInputSx = {
  '& .MuiOutlinedInput-root': {
    color: 'white',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
    '&.Mui-focused fieldset': { borderColor: '#22c55e' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
  // Colore aussi l'icône du date picker en blanc
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: 'rgba(255,255,255,0.65)',
  },
  // Colore le texte dans le champ input[type=date] nativement
  '& input[type="date"]::-webkit-calendar-picker-indicator': {
    filter: 'invert(1) opacity(0.6)',
    cursor: 'pointer',
  },
};

export function TournoisResponsable() {
  const navigate = useNavigate();

  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('Votre équipe');
  const [rows, setRows] = useState<MatchSelectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectionFilter, setSelectionFilter] =
    useState<SelectionStatusFilter>('ALL');
  const [tournamentFilter, setTournamentFilter] =
    useState<TournamentStateFilter>('ALL');
  const [matchFilter, setMatchFilter] = useState<MatchStateFilter>('ALL');

  // ── NOUVEAUX états pour le filtre de date ──────────────────────────────────
  const [dateFrom, setDateFrom] = useState<string>(''); // format "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState<string>(''); // format "YYYY-MM-DD"
  // ──────────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const token = getAuthenticatedUser()?.token;
    if (!token) {
      setErrorMessage('Session expirée. Veuillez vous reconnecter.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const myTeam = await getUserTeam();
      if (!myTeam) {
        setRows([]);
        setTeamId(null);
        setTeamName('Votre équipe');
        return;
      }

      setTeamId(myTeam.id);
      setTeamName(myTeam.name);

      const directTeamMatches = await fetchTeamMatches(myTeam.id);
      let teamMatches = directTeamMatches;

      if (teamMatches.length === 0) {
        const registrations = await fetchTeamRegistrations(
          myTeam.id,
          token,
        ).catch(() => []);

        const matchesByTournament = await Promise.all(
          registrations.map(async (registration) => {
            const matches = await fetchTournamentMatches(
              registration.tournoiId,
            ).catch(() => []);

            return matches.filter(
              (match) =>
                match.team1Id === myTeam.id || match.team2Id === myTeam.id,
            );
          }),
        );

        teamMatches = matchesByTournament.flat();
      }

      const uniqueMatches = Array.from(
        new Map(teamMatches.map((match) => [match.id, match])).values(),
      );

      const loadedRows = await Promise.all(
        uniqueMatches.map(async (match) => {
          try {
            const [editor, tournament, selections] = await Promise.all([
              fetchTeamSelectionEditor(match.id, myTeam.id, token).catch(
                () => null,
              ),
              fetchTournamentById(match.tournamentId).catch(() => null),
              fetchMatchSelections(match.id, token).catch(() => []),
            ]);

            const selectedFromSelections = selections.filter(
              (selection) => selection.teamId === myTeam.id,
            ).length;

            const row: MatchSelectionRow = {
              match,
              tournamentName:
                tournament?.nom || `Tournoi #${match.tournamentId}`,
              tournamentEtat: tournament?.etat || 'INCONNU',
              canEdit: editor?.canEdit === true,
              selectedCount: editor?.selectedCount ?? selectedFromSelections,
              maxPlayers: editor?.maxPlayers ?? null,
            };

            return row;
          } catch {
            return null;
          }
        }),
      );

      const validRows = loadedRows
        .filter((row): row is MatchSelectionRow => row !== null)
        .sort((a, b) => {
          const aTime = a.match.scheduledDateTime
            ? Date.parse(a.match.scheduledDateTime)
            : Number.MIN_SAFE_INTEGER;
          const bTime = b.match.scheduledDateTime
            ? Date.parse(b.match.scheduledDateTime)
            : Number.MIN_SAFE_INTEGER;
          return bTime - aTime;
        });

      setRows(validRows);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les matchs de sélection.',
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    // Convertit "YYYY-MM-DD" en timestamps début/fin de journée
    const fromTs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const toTs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

    return rows.filter((row) => {
      if (normalizedSearch) {
        const haystack =
          `${row.tournamentName} ${row.match.team1Name || ''} ${row.match.team2Name || ''}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      // ── Filtre par date ──────────────────────────────────────────────────
      if (fromTs !== null || toTs !== null) {
        const matchTs = row.match.scheduledDateTime
          ? Date.parse(row.match.scheduledDateTime)
          : null;

        // Un match sans date ne passe pas si un filtre date est actif
        if (matchTs === null) return false;
        if (fromTs !== null && matchTs < fromTs) return false;
        if (toTs !== null && matchTs > toTs) return false;
      }
      // ────────────────────────────────────────────────────────────────────

      if (selectionFilter === 'TO_COMPLETE') {
        if (row.maxPlayers === null) {
          if (row.selectedCount > 0) return false;
        } else if (row.selectedCount >= row.maxPlayers) {
          return false;
        }
      }

      if (selectionFilter === 'COMPLETE') {
        if (row.maxPlayers === null || row.selectedCount < row.maxPlayers) {
          return false;
        }
      }

      if (matchFilter === 'NOT_FINISHED' && isFinishedMatch(row.match)) {
        return false;
      }

      if (matchFilter === 'FINISHED' && !isFinishedMatch(row.match)) {
        return false;
      }

      if (tournamentFilter !== 'ALL') {
        const normalizedEtat = (row.tournamentEtat || '').toUpperCase();
        if (normalizedEtat !== tournamentFilter) return false;
      }

      return true;
    });
  }, [
    rows,
    search,
    selectionFilter,
    matchFilter,
    tournamentFilter,
    dateFrom,
    dateTo,
  ]);

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        py: 5,
        background:
          'radial-gradient(circle at top, rgba(34,197,94,0.10), transparent 28%), linear-gradient(180deg, #0b1020 0%, #0d1426 100%)',
      }}
    >
      <Container maxWidth="lg">
        <BackButton />

        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 900 }}>
            Gérer sélection
          </Typography>
          <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.75)' }}>
            {teamName}: tous les matchs de l'équipe (du plus récent au plus
            ancien).
          </Typography>
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            bgcolor: 'rgba(17,24,39,0.72)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <CardContent>
            {/* Ligne 1 : recherche texte + filtres dropdown */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <TextField
                fullWidth
                size="small"
                label="Rechercher"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tournoi ou équipe"
                sx={darkInputSx}
              />

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.65)' }}>
                  Filtre match
                </InputLabel>
                <Select
                  value={matchFilter}
                  label="Filtre match"
                  onChange={(event: SelectChangeEvent<MatchStateFilter>) =>
                    setMatchFilter(event.target.value as MatchStateFilter)
                  }
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.18)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.32)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#22c55e',
                    },
                  }}
                >
                  <MenuItem value="ALL">Tous les matchs</MenuItem>
                  <MenuItem value="NOT_FINISHED">Matchs non terminés</MenuItem>
                  <MenuItem value="FINISHED">Matchs terminés</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.65)' }}>
                  Filtre sélection
                </InputLabel>
                <Select
                  value={selectionFilter}
                  label="Filtre sélection"
                  onChange={(event: SelectChangeEvent<SelectionStatusFilter>) =>
                    setSelectionFilter(
                      event.target.value as SelectionStatusFilter,
                    )
                  }
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.18)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.32)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#22c55e',
                    },
                  }}
                >
                  <MenuItem value="ALL">Tous</MenuItem>
                  <MenuItem value="TO_COMPLETE">
                    Sans sélection / incomplète
                  </MenuItem>
                  <MenuItem value="COMPLETE">Sélection complète</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.65)' }}>
                  Filtre tournoi
                </InputLabel>
                <Select
                  value={tournamentFilter}
                  label="Filtre tournoi"
                  onChange={(event: SelectChangeEvent<TournamentStateFilter>) =>
                    setTournamentFilter(
                      event.target.value as TournamentStateFilter,
                    )
                  }
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.18)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.32)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#22c55e',
                    },
                  }}
                >
                  <MenuItem value="ALL">Tous les tournois</MenuItem>
                  <MenuItem value="OUVERT">Tournois ouverts</MenuItem>
                  <MenuItem value="CLOTURE">Tournois clôturés</MenuItem>
                  <MenuItem value="EN_COURS">Tournois en cours</MenuItem>
                  <MenuItem value="TERMINE">Tournois terminés</MenuItem>
                  <MenuItem value="ANNULE">Tournois annulés</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* ── Ligne 2 : filtre par plage de dates ── */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
            >
              <TextField
                size="small"
                type="date"
                label="Date du"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: dateTo || undefined }}
                sx={{ ...darkInputSx, minWidth: 180 }}
              />
              <TextField
                size="small"
                type="date"
                label="Date au"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: dateFrom || undefined }}
                sx={{ ...darkInputSx, minWidth: 180 }}
              />
              {/* Bouton reset rapide visible seulement si une date est sélectionnée */}
              {(dateFrom || dateTo) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    borderColor: 'rgba(255,255,255,0.25)',
                    '&:hover': {
                      borderColor: '#22c55e',
                      color: '#22c55e',
                      bgcolor: 'transparent',
                    },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Réinitialiser dates
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : filteredRows.length === 0 ? (
          <Alert severity="info">
            Aucun match trouvé avec les filtres actuels.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {filteredRows.map((row) => {
              const team1 =
                row.match.team1Name || `Équipe #${row.match.team1Id || '?'}`;
              const team2 =
                row.match.team2Name || `Équipe #${row.match.team2Id || '?'}`;

              return (
                <Card
                  key={row.match.id}
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'rgba(17,24,39,0.72)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 800 }}>
                          {team1} vs {team2}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: 'rgba(255,255,255,0.72)' }}
                        >
                          {row.tournamentName} -{' '}
                          {formatDateTime(row.match.scheduledDateTime)}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          {/* ❌ L'ÉTAT DU TOURNOI ÉTAIT ICI ET A ÉTÉ RETIRÉ ! */}
                          <Chip
                            size="small"
                            label={
                              row.maxPlayers === null
                                ? `${row.selectedCount} sélectionné(s)`
                                : `${row.selectedCount}/${row.maxPlayers} joueurs`
                            }
                            sx={{
                              bgcolor:
                                row.maxPlayers === null ||
                                row.selectedCount < row.maxPlayers
                                  ? 'rgba(245,158,11,0.22)'
                                  : 'rgba(34,197,94,0.22)',
                              color:
                                row.maxPlayers === null ||
                                row.selectedCount < row.maxPlayers
                                  ? '#fcd34d'
                                  : '#86efac',
                              fontWeight: 700,
                            }}
                          />
                          <Chip
                            size="small"
                            label={
                              isFinishedMatch(row.match) ? 'Terminé' : 'À jouer'
                            }
                            sx={{
                              bgcolor: isFinishedMatch(row.match)
                                ? 'rgba(100,116,139,0.25)'
                                : 'rgba(59,130,246,0.2)',
                              color: isFinishedMatch(row.match)
                                ? '#cbd5e1'
                                : '#bfdbfe',
                              fontWeight: 700,
                            }}
                          />
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          variant={row.canEdit ? 'contained' : 'outlined'}
                          onClick={() =>
                            navigate(
                              `/tournois/${row.match.tournamentId}/matchs/${row.match.id}`,
                            )
                          }
                          sx={{
                            bgcolor: row.canEdit ? '#22c55e' : 'transparent',
                            color: 'white',
                            borderColor: row.canEdit
                              ? 'transparent'
                              : 'rgba(255,255,255,0.35)',
                            '&:hover': {
                              bgcolor: row.canEdit
                                ? '#16a34a'
                                : 'rgba(255,255,255,0.08)',
                            },
                          }}
                        >
                          {row.canEdit ? 'Modifier sélection' : 'Voir match'}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        {!loading && teamId === null && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Aucune équipe trouvée pour ce compte.
          </Alert>
        )}
      </Container>
    </Box>
  );
}
