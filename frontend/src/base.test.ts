import { describe, it, expect } from 'vitest';

/**
 * On crée un petit examen factice pour le robot du pipeline.
 * Le robot va lire ça et se dire : "Ah, j'ai trouvé un test à faire !"
 */
describe('Examen de base pour le robot', () => {
  it('devrait toujours réussir car 1 + 1 font 2', () => {
    // On demande au robot de vérifier si 1 + 1 est bien égal à 2
    expect(1 + 1).toBe(2);
  });
});
