import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { TeamMatch } from '../../../services/tournaments';

const BRACKET_CARD_HEIGHT = 108;
const BRACKET_BASE_GAP = 18;
const BRACKET_STRIDE = BRACKET_CARD_HEIGHT + 2 * BRACKET_BASE_GAP; // 144

type BracketSlot = {
  id: number | string;
  round: number;
  team1Name: string;
  team2Name: string;
  score1?: number;
  score2?: number;
  dateMatch?: string;
  status: string;
  isBye?: boolean;
  topY: number;
};

// Generates a unique and consistent color based on the team name
const getTeamColor = (name: string): string => {
  if (!name || name === '?') return '#94a3b8';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 85%, 65%)`;
};

// Utility function to infer who advances to the next round
const getWinnerName = (slot: BracketSlot): string => {
  if (slot.isBye) return slot.team1Name;

  const statusVal = slot.status?.toUpperCase() || '';
  if (statusVal === 'FINISHED' || statusVal === 'TERMINE') {
    const s1 = slot.score1 ?? 0;
    const s2 = slot.score2 ?? 0;
    if (s1 > s2) return slot.team1Name;
    if (s2 > s1) return slot.team2Name;
  }
  return '?';
};

const buildBracketTree = (matches: TeamMatch[]): BracketSlot[][] => {
  if (matches.length === 0) return [];

  const minRound = matches.reduce(
    (acc, match) => Math.min(acc, match.round ?? 1),
    Number.MAX_SAFE_INTEGER,
  );

  const round1 = matches.filter((match) => (match.round ?? 1) === minRound);

  const realRaw = round1
    .filter((m) => m.team2Id != null || m.team2Name != null)
    .sort((a, b) => {
      if (a.scheduledDateTime && b.scheduledDateTime) {
        return (
          new Date(a.scheduledDateTime).getTime() -
          new Date(b.scheduledDateTime).getTime()
        );
      }
      return String(a.id).localeCompare(String(b.id));
    });

  const byeRaw =
    round1.find((m) => m.team2Id == null && m.team2Name == null) ?? null;

  if (realRaw.length === 0) return [];

  const realSlots: BracketSlot[] = realRaw.map((match, i) => ({
    id: match.id,
    round: 1,
    team1Name: match.team1Name ?? '?',
    team2Name: match.team2Name ?? '?',
    dateMatch: match.scheduledDateTime,
    status: match.status,
    isBye: false,
    topY: i * BRACKET_STRIDE,
  }));

  const byeSlot: BracketSlot | null = byeRaw
    ? {
        id: byeRaw.id,
        round: 1,
        team1Name: byeRaw.team1Name ?? '?',
        team2Name: '',
        status: byeRaw.status,
        isBye: true,
        topY: realSlots.length * BRACKET_STRIDE,
      }
    : null;

  const round1Slots = byeSlot ? [...realSlots, byeSlot] : realSlots;
  const tree: BracketSlot[][] = [round1Slots];

  let prevRound: BracketSlot[] = round1Slots;
  let roundNumber = 2;

  while (prevRound.length > 1) {
    const nextRound: BracketSlot[] = [];

    const currentRoundMatches = matches.filter(
      (m) => (m.round ?? 1) === roundNumber,
    );
    currentRoundMatches.sort((a, b) =>
      String(a.id).localeCompare(String(b.id)),
    );

    let matchIndexCursor = 0;

    for (let j = 0; j < Math.ceil(prevRound.length / 2); j++) {
      const p1 = prevRound[j * 2];
      const p2 = prevRound[j * 2 + 1];

      if (!p2) {
        nextRound.push({
          id: `placeholder-orphan-${roundNumber}-${j + 1}`,
          round: roundNumber,
          team1Name: getWinnerName(p1),
          team2Name: '',
          isBye: true,
          status: 'PENDING',
          topY: p1.topY,
        });
        continue;
      }

      const p1Center = p1.topY + BRACKET_CARD_HEIGHT / 2;
      const p2Center = p2.topY + BRACKET_CARD_HEIGHT / 2;
      const myCenter = (p1Center + p2Center) / 2;

      const expectedT1 = getWinnerName(p1);
      const expectedT2 = getWinnerName(p2);

      let realMatchIndex = currentRoundMatches.findIndex((m) => {
        const t1 = m.team1Name;
        const t2 = m.team2Name;
        return (
          (expectedT1 !== '?' && (t1 === expectedT1 || t2 === expectedT1)) ||
          (expectedT2 !== '?' && (t1 === expectedT2 || t2 === expectedT2))
        );
      });

      if (
        realMatchIndex === -1 &&
        matchIndexCursor < currentRoundMatches.length
      ) {
        realMatchIndex = matchIndexCursor;
      }

      let realMatch: TeamMatch | undefined = undefined;
      if (realMatchIndex !== -1) {
        realMatch = currentRoundMatches.splice(realMatchIndex, 1)[0];
        matchIndexCursor++;
      }

      if (realMatch) {
        nextRound.push({
          id: realMatch.id,
          round: roundNumber,
          team1Name: realMatch.team1Name ?? expectedT1,
          team2Name: realMatch.team2Name ?? expectedT2,
          dateMatch: realMatch.scheduledDateTime,
          status: realMatch.status,
          isBye: false,
          topY: myCenter - BRACKET_CARD_HEIGHT / 2,
        });
      } else {
        nextRound.push({
          id: `placeholder-${roundNumber}-${j + 1}`,
          round: roundNumber,
          team1Name: expectedT1,
          team2Name: expectedT2,
          status: 'PENDING',
          isBye: false,
          topY: myCenter - BRACKET_CARD_HEIGHT / 2,
        });
      }
    }
    tree.push(nextRound);
    prevRound = nextRound;
    roundNumber += 1;
  }

  return tree;
};

const getRoundLabel = (roundIndex: number, totalRounds: number): string => {
  const distanceToFinal = totalRounds - roundIndex;
  if (distanceToFinal === 1) return 'Finale';
  if (distanceToFinal === 2) return 'Demi-finale';
  if (distanceToFinal === 3) return 'Quart de finale';
  return `Tour ${roundIndex + 1}`;
};

const formatMatchDateTime = (dateValue?: string): string => {
  if (!dateValue) return 'Date à définir';
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return dateValue;
  return parsedDate.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const computePlaceholderDate = (
  roundIndex: number,
  totalRounds: number,
  endDate: string | null,
): string | undefined => {
  if (!endDate) return undefined;
  const finalDate = new Date(`${endDate}T10:00:00`);
  if (isNaN(finalDate.getTime())) return undefined;
  const distanceFromFinal = totalRounds - 1 - roundIndex;
  const d = new Date(finalDate);
  d.setDate(d.getDate() - distanceFromFinal * 2);
  return d.toISOString();
};

type Props = {
  matches: TeamMatch[];
  tournamentEndDate?: string | null;
  selectedMatchId?: number | null;
  onMatchSelect?: (matchId: number) => void;
};

const LINE_COLOR = 'rgba(148,163,184,0.55)';
const THICKNESS = 2;

const TournamentBracket = ({
  matches,
  tournamentEndDate = null,
  selectedMatchId = null,
  onMatchSelect,
}: Props) => {
  const bracketTree = buildBracketTree(matches);

  if (bracketTree.length === 0) return null;

  return (
    <Box sx={{ overflow: 'auto', pb: 12, pt: 1, minHeight: '60vh' }}>
      <Box
        sx={{
          minWidth: 980,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          pb: 5,
        }}
      >
        {bracketTree.map((roundMatches, roundIndex) => {
          const hasNextRound = roundIndex < bracketTree.length - 1;
          const columnTopY = roundMatches[0].topY;
          const lastSlotTopY = roundMatches[roundMatches.length - 1].topY;
          const roundHeight = lastSlotTopY - columnTopY + BRACKET_CARD_HEIGHT;

          return (
            <Box
              key={`round-${roundIndex + 1}`}
              sx={{
                width: 260,
                mt: `${columnTopY}px`,
                position: 'relative',
                zIndex: roundIndex === 0 ? 3 : 1,
                minHeight: `${roundHeight + 56}px`,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, color: '#93c5fd', fontWeight: 700 }}
              >
                {getRoundLabel(roundIndex, bracketTree.length)}
              </Typography>

              <Box
                sx={{
                  position: 'relative',
                  height: roundHeight,
                  overflow: 'visible',
                }}
              >
                {/* ── Connectors ── */}
                {hasNextRound &&
                  roundMatches.map((match, matchIndex) => {
                    if (matchIndex % 2 !== 0) return null;

                    const partner = roundMatches[matchIndex + 1];
                    const nextRoundSlotIndex = Math.floor(matchIndex / 2);
                    const targetMatch =
                      bracketTree[roundIndex + 1]?.[nextRoundSlotIndex];
                    if (!targetMatch) return null;

                    const y1 =
                      match.topY - columnTopY + BRACKET_CARD_HEIGHT / 2;
                    const y2 = partner
                      ? partner.topY - columnTopY + BRACKET_CARD_HEIGHT / 2
                      : y1;
                    const yTarget =
                      targetMatch.topY - columnTopY + BRACKET_CARD_HEIGHT / 2;

                    const yMin = Math.min(y1, y2, yTarget);
                    const yMax = Math.max(y1, y2, yTarget);
                    const spineHeight = yMax - yMin;

                    const startX = 260;
                    const elbowX = 284;
                    const endX = 308;

                    return (
                      <Box
                        key={`connector-${match.id}`}
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          overflow: 'visible',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${startX}px`,
                            top: `${y1 - THICKNESS / 2}px`,
                            width: `${elbowX - startX}px`,
                            height: `${THICKNESS}px`,
                            bgcolor: LINE_COLOR,
                          }}
                        />
                        {partner && (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: `${startX}px`,
                              top: `${y2 - THICKNESS / 2}px`,
                              width: `${elbowX - startX}px`,
                              height: `${THICKNESS}px`,
                              bgcolor: LINE_COLOR,
                            }}
                          />
                        )}
                        {spineHeight > 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: `${elbowX}px`,
                              top: `${yMin - THICKNESS / 2}px`,
                              width: `${THICKNESS}px`,
                              height: `${spineHeight + THICKNESS}px`,
                              bgcolor: LINE_COLOR,
                            }}
                          />
                        )}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${elbowX}px`,
                            top: `${yTarget - THICKNESS / 2}px`,
                            width: `${endX - elbowX}px`,
                            height: `${THICKNESS}px`,
                            bgcolor: LINE_COLOR,
                          }}
                        />
                      </Box>
                    );
                  })}

                {/* ── Cards ── */}
                {roundMatches.map((match) => {
                  const statusVal = match.status?.toUpperCase() || '';
                  const isFinished =
                    statusVal === 'FINISHED' || statusVal === 'TERMINE';
                  const isPlaceholder =
                    typeof match.id === 'string' &&
                    match.id.startsWith('placeholder-');
                  const isBye = match.isBye === true;
                  const numericMatchId = Number(match.id);
                  const isMatchSelectable =
                    !isPlaceholder && Number.isFinite(numericMatchId);
                  const isSelected =
                    isMatchSelectable && selectedMatchId === numericMatchId;
                  const top = match.topY - columnTopY;
                  const displayDate = isPlaceholder
                    ? computePlaceholderDate(
                        roundIndex,
                        bracketTree.length,
                        tournamentEndDate,
                      )
                    : match.dateMatch;

                  const s1 = match.score1 ?? 0;
                  const s2 = match.score2 ?? 0;
                  const isWinner1 = s1 > s2;
                  const isWinner2 = s2 > s1;
                  const isDraw = s1 === s2;
                  const triggerSelect = () => {
                    if (isMatchSelectable && onMatchSelect) {
                      onMatchSelect(numericMatchId);
                    }
                  };

                  return (
                    <Box
                      key={match.id}
                      onPointerDown={
                        isMatchSelectable ? triggerSelect : undefined
                      }
                      onClick={isMatchSelectable ? triggerSelect : undefined}
                      role={isMatchSelectable ? 'button' : undefined}
                      tabIndex={isMatchSelectable ? 0 : -1}
                      onKeyDown={
                        isMatchSelectable
                          ? (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                triggerSelect();
                              }
                            }
                          : undefined
                      }
                      sx={{
                        height: BRACKET_CARD_HEIGHT,
                        width: 260,
                        p: 1.2,
                        boxSizing: 'border-box',
                        borderRadius: 1.5,
                        border: isSelected
                          ? '2px solid #e8822a'
                          : isPlaceholder
                            ? '2px dashed rgba(255,255,255,0.22)'
                            : isBye
                              ? '2px solid rgba(234,179,8,0.45)'
                              : '2px solid rgba(255,255,255,0.28)',
                        backgroundColor: isBye
                          ? 'rgba(234,179,8,0.05)'
                          : 'rgba(255,255,255,0.02)',
                        position: 'absolute',
                        left: 0,
                        top: `${top}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: isMatchSelectable ? 'pointer' : 'default',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected
                          ? '0 0 0 1px rgba(232,130,42,0.45), 0 10px 24px rgba(232,130,42,0.16)'
                          : 'none',
                        '&:hover': isMatchSelectable
                          ? {
                              borderColor: 'rgba(232,130,42,0.75)',
                              backgroundColor: 'rgba(232,130,42,0.06)',
                            }
                          : undefined,
                      }}
                    >
                      <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                        {/* Equipe 1 */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography
                            fontWeight={700}
                            variant="body2"
                            sx={{ color: getTeamColor(match.team1Name) }}
                          >
                            {match.team1Name}
                          </Typography>
                          {isFinished && !isBye && (
                            <Typography
                              fontWeight={800}
                              variant="body2"
                              sx={{
                                color:
                                  isWinner1 || isDraw
                                    ? '#ffffff'
                                    : 'rgba(255,255,255,0.4)',
                              }}
                            >
                              {s1}
                            </Typography>
                          )}
                        </Stack>

                        {/* Equipe 2 */}
                        {isBye ? (
                          <Typography
                            variant="caption"
                            sx={{ color: '#fde047', opacity: 0.75 }}
                          >
                            Qualifiée d'office
                          </Typography>
                        ) : (
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              fontWeight={700}
                              variant="body2"
                              sx={{ color: getTeamColor(match.team2Name) }}
                            >
                              {match.team2Name}
                            </Typography>
                            {isFinished && (
                              <Typography
                                fontWeight={800}
                                variant="body2"
                                sx={{
                                  color:
                                    isWinner2 || isDraw
                                      ? '#ffffff'
                                      : 'rgba(255,255,255,0.4)',
                                }}
                              >
                                {s2}
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: isBye ? 1 : 'auto' }}
                      >
                        <Chip
                          size="small"
                          label={
                            isBye
                              ? 'Tour automatique'
                              : isPlaceholder
                                ? 'En attente'
                                : isFinished
                                  ? 'Terminé'
                                  : 'À jouer'
                          }
                          sx={{
                            bgcolor: isBye
                              ? 'rgba(234,179,8,0.18)'
                              : isPlaceholder
                                ? 'rgba(148,163,184,0.15)'
                                : isFinished
                                  ? 'rgba(16,185,129,0.15)'
                                  : 'rgba(232,130,42,0.15)',
                            color: isBye
                              ? '#fde047'
                              : isPlaceholder
                                ? '#cbd5e1'
                                : isFinished
                                  ? '#10b981'
                                  : '#e8822a',
                          }}
                        />

                        {isMatchSelectable && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={(event) => {
                              event.stopPropagation();
                              triggerSelect();
                            }}
                            sx={{
                              minWidth: 0,
                              px: 0.75,
                              color: '#93c5fd',
                              textTransform: 'none',
                              fontSize: '0.72rem',
                              lineHeight: 1,
                            }}
                          >
                            Voir le detail
                          </Button>
                        )}
                      </Stack>

                      {!isBye && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.8, lineHeight: 1 }}
                        >
                          {formatMatchDateTime(displayDate)}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default TournamentBracket;
