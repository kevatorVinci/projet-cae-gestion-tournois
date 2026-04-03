import { Page, expect } from '@playwright/test';

export class AdminUserPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/admin');
    await this.page.waitForSelector('table', { state: 'visible' });
  }

  async navigateToAdminView() {
    await this.page.getByRole('button', { name: /vue admin/i }).click({ force: true });
    await expect(this.page).toHaveURL(/.*admin/, { timeout: 10000 });
    await this.page.waitForSelector('table', { state: 'visible' });
  }

  async switchToPlayerView() {
    await this.page.getByRole('button', { name: /vue joueur/i }).click({ force: true });
    await expect(this.page).toHaveURL('/', { timeout: 10000 });
  }

  async searchUser(term: string) {
    const searchField = this.page.getByPlaceholder(/chercher un joueur/i);
    await searchField.fill(term);
  }

  async promoteUserToAdmin(email: string) {
    const row = this.page.locator('tr', { hasText: email });
    const promoteBtn = row.getByRole('button', { name: /nommer admin/i });
    await promoteBtn.click({ force: true });
  }

  async removeAdminRole(email: string) {
    const row = this.page.locator('tr', { hasText: email });
    const removeBtn = row.getByRole('button', { name: /retirer admin/i });
    await removeBtn.click({ force: true });
  }

  async banUser(email: string, reason?: string) {
    const row = this.page.locator('tr', { hasText: email });
    await row.getByRole('button', { name: /bannir/i }).click({ force: true });

    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    if (reason) {
      await dialog.getByPlaceholder(/raison du bannissement/i).fill(reason);
    }

    await dialog.getByRole('button', { name: /confirmer le ban/i }).click({ force: true });
  }

  async cancelBanDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /annuler/i }).click({ force: true });
    await expect(dialog).not.toBeVisible();
  }

  async verifySuccessMessage(text: string | RegExp) {
    const alert = this.page.locator('.MuiAlert-root');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(text);
  }

  async verifyUserIsBanned(email: string) {
    await this.searchUser(email);
    await expect(this.page.getByText(/compte banni/i)).toBeVisible({ timeout: 10000 });
  }

  async verifyUserIsAdmin(email: string) {
    const row = this.page.locator('tr', { hasText: email });
    await expect(row.getByText(/administrateur/i)).toBeVisible({ timeout: 10000 });
  }
}