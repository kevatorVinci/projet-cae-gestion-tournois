import { Box, Chip, Stack, Typography } from '@mui/material';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TeamMatch } from '../../../services/tournaments';
import { getRoundLabel } from '../../../utils/bracketLabels';

const BRACKET_CARD_HEIGHT = 108;
const BRACKET_BASE_GAP = 18;
const BRACKET_STRIDE = BRACKET_CARD_HEIGHT + 2 * BRACKET_BASE_GAP; // 144

const IDEAL_CARD_WIDTH = 260;
const MIN_CARD_WIDTH = 200;
const IDEAL_GAP = 48;
const MIN_GAP = 20;

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

const STATUS_ACCENT = {
  FINISHED: '#10b981',
  TO_PLAY: '#e8822a',
  PENDING: 'rgba(148,163,184,0.5)',
  BYE: '#eab308',
  SELECTED: '#e8822a',
} as const;

// Utility function to infer who advances to the next round
const getWinnerName = (slot: BracketSlot): string => {
  if (slot.isBye) return slot.team1Name;

  // Use scores whenever they are available (FINISHED, WAITING_VALIDATION, DISPUTED…)
  if (slot.score1 != null || slot.score2 != null) {
    const s1 = slot.score1 ?? 0;
    const s2 = slot.score2 ?? 0;
    if (s1 > s2) return slot.team1Name;
    if (s2 > s1) return slot.team2Name;
  }

  // FIX: Make sure we also evaluate statuses like WAITING_VALIDATION properly
  const statusVal = slot.status?.toUpperCase() || '';
  if (['FINISHED', 'TERMINE', 'WAITING_VALIDATION'].includes(statusVal)) {
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

  const round1 = matches
    .filter((match) => (match.round ?? 1) === minRound)
    .sort((a, b) => {
      if (a.scheduledDateTime && b.scheduledDateTime) {
        const diff =
          new Date(a.scheduledDateTime).getTime() -
          new Date(b.scheduledDateTime).getTime();
        if (diff !== 0) return diff;
      }
      return String(a.id).localeCompare(String(b.id));
    });

  if (round1.length === 0) return [];

  const round1Slots: BracketSlot[] = round1.map((match, i) => {
    const isBye =
      (match.team1Id != null || !!match.team1Name) &&
      match.team2Id == null &&
      match.team2Name == null;
    return {
      id: match.id,
      round: 1,
      team1Name: match.team1Name ?? '?',
      team2Name: isBye ? '' : (match.team2Name ?? '?'),
      score1: match.scoreTeam1,
      score2: match.scoreTeam2,
      dateMatch: match.scheduledDateTime,
      status: match.status,
      isBye,
      topY: i * BRACKET_STRIDE,
    };
  });

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

      // FIX: Since we splice the array below, matchIndexCursor logic is flawed.
      // We just take the first element (index 0) if we couldn't find a direct match
      // but there are still matches available for this round.
      if (realMatchIndex === -1 && currentRoundMatches.length > 0) {
        realMatchIndex = 0;
      }

      let realMatch: TeamMatch | undefined = undefined;
      if (realMatchIndex !== -1) {
        realMatch = currentRoundMatches.splice(realMatchIndex, 1)[0];
      }

      if (realMatch) {
        // FIX: Add defensive check (roundNumber === 1) or stricter validation
        // to prevent later rounds from falsely reporting "Qualifiée d'office"
        // due to database nulls while waiting for teams to advance.
        const isDbBye =
          (realMatch.team1Id != null || !!realMatch.team1Name) &&
          realMatch.team2Id == null &&
          realMatch.team2Name == null;

        const realMatchIsBye = isDbBye && roundNumber === 1;

        nextRound.push({
          id: realMatch.id,
          round: roundNumber,
          team1Name: realMatch.team1Name ?? expectedT1,
          team2Name: realMatch.team2Name ?? expectedT2,
          score1: realMatch.scoreTeam1,
          score2: realMatch.scoreTeam2,
          dateMatch: realMatch.scheduledDateTime,
          status: realMatch.status,
          isBye: realMatchIsBye,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { cardWidth, gapPx } = useMemo(() => {
    const rounds = bracketTree.length;
    if (rounds === 0 || containerWidth === 0) {
      return { cardWidth: IDEAL_CARD_WIDTH, gapPx: IDEAL_GAP };
    }
    const idealTotal = rounds * IDEAL_CARD_WIDTH + (rounds - 1) * IDEAL_GAP;
    if (idealTotal <= containerWidth) {
      return { cardWidth: IDEAL_CARD_WIDTH, gapPx: IDEAL_GAP };
    }
    const available = containerWidth - (rounds - 1) * MIN_GAP;
    const computed = Math.floor(available / rounds);
    if (computed >= MIN_CARD_WIDTH) {
      return { cardWidth: computed, gapPx: MIN_GAP };
    }
    return { cardWidth: MIN_CARD_WIDTH, gapPx: MIN_GAP };
  }, [containerWidth, bracketTree.length]);

  if (bracketTree.length === 0) return null;

  return (
    <Box
      ref={containerRef}
      sx={{
        overflow: 'auto',
        pb: 12,
        pt: 1,
        minHeight: '60vh',
        width: '100%',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          gap: `${gapPx}px`,
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
                width: `${cardWidth}px`,
                flexShrink: 0,
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

                    const startX = cardWidth;
                    const elbowX = cardWidth + gapPx / 2;
                    const endX = cardWidth + gapPx;

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
                  const isAwaitingTeams =
                    !isBye &&
                    (match.team1Name === '?' ||
                      match.team2Name === '?' ||
                      !match.team1Name ||
                      !match.team2Name);
                  const numericMatchId = Number(match.id);
                  const isLockedMatch =
                    isPlaceholder || isBye || isAwaitingTeams;
                  const isMatchSelectable =
                    !isLockedMatch && Number.isFinite(numericMatchId);
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
                  const isWinner1 = isFinished && s1 > s2;
                  const isWinner2 = isFinished && s2 > s1;
                  const isDraw = isFinished && s1 === s2;

                  const baseAccent = isBye
                    ? STATUS_ACCENT.BYE
                    : isPlaceholder || isAwaitingTeams
                      ? STATUS_ACCENT.PENDING
                      : isFinished
                        ? STATUS_ACCENT.FINISHED
                        : STATUS_ACCENT.TO_PLAY;
                  const accentColor = isSelected
                    ? STATUS_ACCENT.SELECTED
                    : baseAccent;
                  const accentWidth = isSelected ? 6 : 4;

                  const getTeamTextColor = (isWinner: boolean) => {
                    if (isBye) return '#ffffff';
                    if (isPlaceholder) return 'rgba(203,213,225,0.75)';
                    if (isFinished) {
                      if (isDraw) return '#ffffff';
                      return isWinner ? '#ffffff' : 'rgba(255,255,255,0.45)';
                    }
                    return 'rgba(255,255,255,0.85)';
                  };
                  const getTeamTextWeight = (isWinner: boolean) => {
                    if (isFinished && !isDraw) return isWinner ? 700 : 500;
                    if (isBye) return 700;
                    return 600;
                  };

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
                        width: `${cardWidth}px`,
                        pl: `${accentWidth + 10}px`,
                        pr: 1.2,
                        py: 1.2,
                        boxSizing: 'border-box',
                        borderRadius: 1.5,
                        border: isPlaceholder
                          ? '1px dashed rgba(148,163,184,0.35)'
                          : '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        position: 'absolute',
                        left: 0,
                        top: `${top}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: isMatchSelectable ? 'pointer' : 'default',
                        transition: 'all 0.18s ease',
                        overflow: 'hidden',
                        boxShadow: isSelected
                          ? '0 0 0 1px rgba(232,130,42,0.35), 0 8px 22px rgba(232,130,42,0.22)'
                          : 'none',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${accentWidth}px`,
                          backgroundColor: accentColor,
                          transition: 'all 0.18s ease',
                        },
                        '&:hover': isMatchSelectable
                          ? {
                              backgroundColor: 'rgba(232,130,42,0.04)',
                              '&::before': {
                                width: '6px',
                                backgroundColor: STATUS_ACCENT.SELECTED,
                                boxShadow: '0 0 12px rgba(232,130,42,0.55)',
                              },
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
                            variant="body2"
                            sx={{
                              color: getTeamTextColor(isWinner1),
                              fontWeight: getTeamTextWeight(isWinner1),
                            }}
                          >
                            {match.team1Name}
                          </Typography>
                          {isFinished && !isBye && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isWinner1 || isDraw ? 800 : 600,
                                color:
                                  isWinner1 || isDraw
                                    ? '#ffffff'
                                    : 'rgba(255,255,255,0.45)',
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
                            sx={{ color: '#fde047', opacity: 0.8 }}
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
                              variant="body2"
                              sx={{
                                color: getTeamTextColor(isWinner2),
                                fontWeight: getTeamTextWeight(isWinner2),
                              }}
                            >
                              {match.team2Name}
                            </Typography>
                            {isFinished && (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: isWinner2 || isDraw ? 800 : 600,
                                  color:
                                    isWinner2 || isDraw
                                      ? '#ffffff'
                                      : 'rgba(255,255,255,0.45)',
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
                        alignItems="center"
                        sx={{ mt: isBye ? 1 : 'auto' }}
                      >
                        <Chip
                          size="small"
                          label={
                            isBye
                              ? 'Tour automatique'
                              : isPlaceholder || isAwaitingTeams
                                ? 'En attente'
                                : isFinished
                                  ? 'Terminé'
                                  : 'À jouer'
                          }
                          sx={{
                            bgcolor: `${accentColor}22`,
                            color: accentColor,
                            fontWeight: 700,
                            border: `1px solid ${accentColor}44`,
                          }}
                        />
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
