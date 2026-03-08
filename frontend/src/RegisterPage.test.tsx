import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import RegisterPage from './components/pages/RegisterPage';

/**
 * Ce test vérifie que la page d'inscription s'affiche correctement.
 * Cela permet de faire monter le "coverage" du pipeline ! 📈
 */
describe('RegisterPage', () => {
  it('devrait afficher le titre de la page', () => {
    // On dessine la page dans un navigateur virtuel
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    // On cherche le texte du titre
    const titleElement = screen.getByText(/Inscription à Vinci Arena/i);

    // On vérifie qu'il est bien présent
    expect(titleElement).toBeDefined();
  });
});
