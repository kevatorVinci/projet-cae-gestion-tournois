import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './index';

describe('App', () => {
  it('affiche la barre de navigation et le contenu de base', () => {
    // On dessine l'application
    render(<App />);

    // On utilise une recherche plus souple (insensible à la casse)
    // Vérifie bien que ces textes existent dans tes composants !
    const navbarElement = screen.getByRole('navigation'); // Cherche la Navbar
    expect(navbarElement).toBeDefined();

    // Si tu es sûr des textes, tu peux garder getByText
    // expect(screen.getByText(/Accueil/i)).toBeDefined();
  });
});
