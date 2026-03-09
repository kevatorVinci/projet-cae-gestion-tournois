import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import RegisterPage from './components/pages/RegisterPage';

describe('RegisterPage', () => {
  it('devrait afficher le titre de la page', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    const titleElement = screen.getByText(/Inscription/i);
    expect(titleElement).toBeDefined();
  });
});
