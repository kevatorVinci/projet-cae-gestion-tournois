import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import { DemandesAdhesion } from './Demande';

vi.mock('../../../../services/demande', () => ({
  getDemandesEnAttenteResponsable: vi.fn(),
  accepterDemande: vi.fn(),
  refuserDemande: vi.fn(),
}));

import {
  getDemandesEnAttenteResponsable,
  accepterDemande,
  refuserDemande,
} from '../../../../services/demande';
import { DemandeDecisionResult } from '../../../../types';

const mockDemandes = [
  {
    idDemande: 1,
    membreTag: 'Joueur1',
    membreEmail: 'joueur1@vinci.be',
    membreId: 10,
    membreSpecialty: 'Tacticien',
    membreProfileImageUrl: '',
    equipeName: 'Les Tacticiens',
    equipeId: 1,
  },
  {
    idDemande: 2,
    membreTag: 'Joueur2',
    membreEmail: 'joueur2@vinci.be',
    membreId: 11,
    membreSpecialty: 'Gardien',
    membreProfileImageUrl: '',
    equipeName: 'Les Tacticiens',
    equipeId: 1,
  },
];

describe('DemandesAdhesion', () => {
  test('displays pending join requests', async () => {
    vi.mocked(getDemandesEnAttenteResponsable).mockResolvedValueOnce(
      mockDemandes,
    );

    render(
      <MemoryRouter>
        <DemandesAdhesion />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/joueur1/i)).toBeDefined();
      expect(screen.getByText(/joueur2/i)).toBeDefined();
    });
  });

  test('shows message when there are no pending requests', async () => {
    vi.mocked(getDemandesEnAttenteResponsable).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <DemandesAdhesion />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/aucune candidature en attente/i)).toBeDefined();
    });
  });

  test('shows error message when loading fails', async () => {
    vi.mocked(getDemandesEnAttenteResponsable).mockRejectedValueOnce(
      new Error('Erreur serveur'),
    );

    render(
      <MemoryRouter>
        <DemandesAdhesion />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/erreur serveur/i)).toBeDefined();
    });
  });

  test('opens accept dialog when clicking "Accepter"', async () => {
    vi.mocked(getDemandesEnAttenteResponsable).mockResolvedValueOnce(
      mockDemandes,
    );

    render(
      <MemoryRouter>
        <DemandesAdhesion />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/joueur1/i)).toBeDefined();
    });

    const acceptButtons = screen.getAllByRole('button', { name: /accepter/i });
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/accepter la candidature/i)).toBeDefined();
    });
  });

  test('calls accepterDemande and removes the request after confirmation', async () => {
    vi.mocked(getDemandesEnAttenteResponsable).mockResolvedValueOnce(
      mockDemandes,
    );
    vi.mocked(accepterDemande).mockResolvedValueOnce(
      undefined as unknown as DemandeDecisionResult,
    );

    render(
      <MemoryRouter>
        <DemandesAdhesion />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/joueur1/i)).toBeDefined();
    });

    const acceptButtons = screen.getAllByRole('button', { name: /accepter/i });
    fireEvent.click(acceptButtons[0]);

    // Confirm in the dialog
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeDefined();
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(accepterDemande).toHaveBeenCalledWith(1);
      expect(
        screen.getByText(/candidature de joueur1 a été acceptée/i),
      ).toBeDefined();
    });
  });

  test('opens refuse dialog when clicking "Refuser"', async () => {
    vi.mocked(getDemandesEnAttenteResponsable).mockResolvedValueOnce(
      mockDemandes,
    );

    render(
      <MemoryRouter>
        <DemandesAdhesion />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/joueur1/i)).toBeDefined();
    });

    const refuseButtons = screen.getAllByRole('button', { name: /refuser/i });
    fireEvent.click(refuseButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/refuser la candidature/i)).toBeDefined();
    });
  });

  test('calls refuserDemande with reason and removes the request', async () => {
    vi.mocked(getDemandesEnAttenteResponsable).mockResolvedValueOnce(
      mockDemandes,
    );
    vi.mocked(refuserDemande).mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <DemandesAdhesion />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/joueur1/i)).toBeDefined();
    });

    const refuseButtons = screen.getAllByRole('button', { name: /refuser/i });
    fireEvent.click(refuseButtons[0]);

    // Fill in the refusal reason
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/motif/i)).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText(/motif/i), {
      target: { value: 'Notre équipe est complète.' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /confirmer le refus/i }),
    );

    await waitFor(() => {
      expect(refuserDemande).toHaveBeenCalledWith(
        1,
        'Notre équipe est complète.',
      );
      expect(
        screen.getByText(/candidature de joueur1 a été refusée/i),
      ).toBeDefined();
    });
  });
});
