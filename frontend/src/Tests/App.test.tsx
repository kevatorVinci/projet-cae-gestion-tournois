import { screen } from '@testing-library/dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../components/App/index';

describe('App', () => {
  it('affiche la barre de navigation et le contenu de base', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /accueil/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /connexion/i })).toBeDefined();
    expect(
      screen.getByText(/là où le génie affronte la bataille/i),
    ).toBeDefined();
  });
});
