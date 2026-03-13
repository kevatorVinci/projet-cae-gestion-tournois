import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RegisterPage from './components/pages/RegisterPage';
import { renderWithProviders } from './test-utils';

describe('RegisterPage', () => {
  it('devrait afficher le titre de la page', () => {
    renderWithProviders(<RegisterPage />);

    const titleElement = screen.getByText(/Inscription/i);
    expect(titleElement).toBeDefined();
  });
});
