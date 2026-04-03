import { Page, expect } from '@playwright/test';

export class TournamentPage {
  constructor(private page: Page) {}

  async switchToAdminView() {
    await this.page.getByRole('button', { name: /vue admin/i }).click({ force: true });
    await expect(
      this.page.locator('.MuiChip-root', { hasText: 'ADMIN' })
    ).toBeVisible({ timeout: 10000 });
  }

  async goToTournamentManagement() {
    await this.page.getByRole('button', { name: /gestion tournoi/i }).click({ force: true });
    await expect(this.page).toHaveURL(/.*admin\/tournaments/, { timeout: 10000 });
  }

  async clickCreateNew() {
    await this.page.getByRole('button', { name: /créer un tournoi/i }).click({ force: true });
    await expect(this.page).toHaveURL(/.*admin\/tournaments\/create/, { timeout: 10000 });
  }

  async fillCreateForm(details: {
    name: string;
    description: string;
    participants: number;
    deadlineDate: string;
    startDate: string;
    endDate: string;
  }) {
    await this.page.locator('input').first().fill(details.name);
    await this.page.locator('textarea').first().fill(details.description);
    await this.page.getByLabel(/nombre max d'équipes/i).fill(details.participants.toString());
    await this.page.getByLabel(/date limite d'inscription/i).fill(details.deadlineDate);
    await this.page.getByLabel(/date de début/i).fill(details.startDate);
    await this.page.getByLabel(/date de fin/i).fill(details.endDate);
  }

  async submitSave() {
    await this.page.getByRole('button', { name: /sauvegarder/i }).click({ force: true });
  }

  async clickModifierOnTournament(name: string) {
    const card = this.page.locator('.MuiCard-root', { hasText: name });
    await card.getByRole('button', { name: /modifier/i }).click({ force: true });
    await expect(this.page).toHaveURL(/.*admin\/tournaments\/edit\/\d+/, { timeout: 10000 });
  }

  async fillEditForm(details: { description: string }) {
    const descField = this.page.locator('textarea').first();
    await descField.clear();
    await descField.fill(details.description);
  }

  async submitEdit() {
    await this.page.getByRole('button', { name: /sauvegarder les modifications/i }).click({ force: true });
  }
}