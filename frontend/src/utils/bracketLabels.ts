/**
 * Returns a human-readable label for a bracket round (0-based index).
 *
 * @param {number} roundIndex 0-based round index.
 * @param {number} totalRounds total number of rounds in the bracket.
 * @return {string} the round label.
 */
export const getRoundLabel = (
  roundIndex: number,
  totalRounds: number,
): string => {
  const distanceToFinal = totalRounds - roundIndex;
  if (distanceToFinal === 1) return 'Finale';
  if (distanceToFinal === 2) return 'Demi-finale';
  if (distanceToFinal === 3) return 'Quart de finale';
  return `Tour ${roundIndex + 1}`;
};

/**
 * Returns a human-readable label for a 1-based round number.
 *
 * @param {number} round 1-based round number.
 * @param {number} maxRound highest round number in the tournament.
 * @return {string} the round label.
 */
export const getRoundLabelFromMax = (
  round: number,
  maxRound: number,
): string => {
  const distanceToFinal = maxRound - round;
  if (distanceToFinal === 0) return 'Finale';
  if (distanceToFinal === 1) return 'Demi-finale';
  if (distanceToFinal === 2) return 'Quart de finale';
  return `Tour ${round}`;
};
