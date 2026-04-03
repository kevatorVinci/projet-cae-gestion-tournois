import { Page, expect } from '@playwright/test';

export class RegisterPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/register');
    await this.page.waitForSelector('input[type="email"]', { state: 'visible' });
  }

  async fillForm(email: string, tag: string) {
    await this.page.locator('input[type="email"]').fill(email);
    await this.page.locator('input[type="password"]').fill('ComplexPass123!');
    await this.page.getByLabel('Tag (Pseudo)').fill(tag);

    // Specialty Select
    await this.page.locator('role=combobox').first().click();
    await this.page.waitForSelector('[role="option"]', { timeout: 10000 });
    await this.page.getByRole('option', { name: 'Architecte' }).click();

    await expect(
      this.page.locator('role=combobox').nth(1)
    ).not.toHaveAttribute('aria-disabled', 'true', { timeout: 15000 });
    await this.page.locator('role=combobox').nth(1).click();
    await this.page.waitForSelector('[role="option"]', { timeout: 10000 });
    await this.page.getByRole('option', { name: 'Aucune équipe' }).click();

    const firstAvatar = this.page.locator('img[alt^="Avatar"]').first();
    await firstAvatar.scrollIntoViewIfNeeded();
    await firstAvatar.click();

    await expect(
      this.page.getByText('Mot de passe fort ✅')
    ).toBeVisible();
  }

  async submit() {
    const submitBtn = this.page.getByRole('button', { name: "S'inscrire" });
    await submitBtn.scrollIntoViewIfNeeded();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
  }
}