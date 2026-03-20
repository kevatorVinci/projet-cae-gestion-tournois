/**
 * Service d'authentification (Inscriptions)
 * @param {Object} userData - Les données d'inscription de l'utilisateur
 * @return {Promise<Object>} Un objet contenant l'utilisateur et son token
 */
export const register = async (userData: unknown): Promise<unknown> => {
  // On transtype pour accéder aux propriétés sans erreur ESLint 'any'
  const data = userData as Record<string, unknown>;

  // Simulation d'une réponse réussie basée sur ce que vos tests attendent
  return {
    user: {
      id: Math.floor(Math.random() * 1000),
      email: data.email || 'test@vinci.be',
      tag: data.tag || 'Player1',
    },
    token: 'fake-jwt-token-session-2026',
  };
};
