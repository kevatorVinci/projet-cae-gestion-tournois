import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Registration Flow', () => {
  test('should register a new user with all fields completed', async ({
    page,
  }) => {
    const randomEmail = faker.internet.email().toLowerCase();
    const strongPassword = 'ComplexPass123!';
    const tag = `Test_${faker.string.alphanumeric(4)}`;

    await page.goto('/register');

    await page.locator('input[type="email"]').fill(randomEmail);
    await page.locator('input[type="password"]').fill(strongPassword);
    await page.getByLabel('Tag (Pseudo)').fill(tag);

    // Target the combobox directly, not the label
    await page.locator('role=combobox').first().click();
    const specialityOption = page.getByRole('option', { name: 'Architecte' });
    await expect(specialityOption).toBeVisible({ timeout: 10000 });
    await specialityOption.click();

    // Wait for team select to be enabled
    await expect(page.locator('role=combobox').nth(1)).not.toHaveAttribute(
      'aria-disabled',
      'true',
      { timeout: 15000 },
    );
    await page.locator('role=combobox').nth(1).click();
    const teamOption = page.getByRole('option', { name: 'Aucune équipe' });
    await expect(teamOption).toBeVisible({ timeout: 10000 });
    await teamOption.click();

    // Avatar
    const firstAvatar = page.locator('img[alt="Avatar 0"]');
    await firstAvatar.scrollIntoViewIfNeeded();
    await expect(firstAvatar).toBeVisible();
    await firstAvatar.click();

    // Check password strength
    await expect(page.getByText('Mot de passe fort ✅')).toBeVisible();

    // Submit
    const submitBtn = page.getByRole('button', { name: "S'inscrire" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Debug: check if an error message appeared
    const errorAlert = page.locator('.MuiAlert-root');
    const hasError = await errorAlert.isVisible().catch(() => false);
    if (hasError) {
      console.log('Error message shown:', await errorAlert.textContent());
    }

    // Redirection
    await expect(page).toHaveURL(/.*login/, { timeout: 30000 });
  });

  test('should keep register button disabled if password is weak', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.locator('input[type="password"]').fill('123');
    await expect(page.getByText('Mot de passe faible ❌')).toBeVisible();
    await expect(
      page.getByRole('button', { name: "S'inscrire" }),
    ).toBeDisabled();
  });
});
