import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './index';

describe('App', () => {
<<<<<<< HEAD
  it('renders navbar and home page content', () => {
    render(<App />);

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Bienvenue sur VinciArena')).toBeInTheDocument();
=======
  it('affiche la barre de navigation et le contenu de base', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /accueil/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /connexion/i })).toBeDefined();
    expect(screen.getByText(/where genius meets battle/i)).toBeDefined();
>>>>>>> origin/develop
  });
});
