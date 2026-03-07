import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './index';

describe('App', () => {
  it('renders navbar and home page content', () => {
    render(<App />);

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Bienvenue sur VinciArena')).toBeInTheDocument();
  });
});
