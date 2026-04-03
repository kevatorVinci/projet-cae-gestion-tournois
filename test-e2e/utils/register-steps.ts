import { Page, expect } from '@playwright/test';

export async function registerNewUser(page: Page, userData: { email: string, tag: string }) {
  await page.goto('/register');

  await page.getByLabel(/Email/i).fill(userData.email);
  // Using a strong password to satisfy your strengthScore === 5 requirement
  await page.getByLabel(/Mot de passe/i).fill('StrongPass123!'); 
  await page.getByLabel(/Tag \(Pseudo\)/i).fill(userData.tag);

  // MUI Select handling
  await page.getByLabel(/Spécialité/i).click();
  await page.getByRole('option', { name: /Architecte/i }).click();

  // Avatar selection (first one)
  await page.locator('img[alt^="Avatar"]').first().click();

  const registerBtn = page.getByRole('button', { name: /S'inscrire/i });
  await expect(registerBtn).toBeEnabled();
  await registerBtn.click();

  // Wait for redirect to login
  await expect(page).toHaveURL(/\/login/);
}