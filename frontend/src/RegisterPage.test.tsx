import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import RegisterPage from './components/pages/RegisterPage';
import { renderWithProviders } from './test-utils';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devrait afficher le titre de la page', () => {
    renderWithProviders(<RegisterPage />);

    const titleElement = screen.getByText(/Inscription/i);
    expect(titleElement).toBeDefined();
  });
});
