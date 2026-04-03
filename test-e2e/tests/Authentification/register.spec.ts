import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { RegisterPage } from '../../pages/RegisterPage';

test.describe('Registration Flow', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.navigate();
  });

  test('should register a new user with all fields completed', async ({ page }) => {
    const randomEmail = faker.internet.email().toLowerCase();
    const tag = `Test_${faker.string.alphanumeric(4)}`;

    await registerPage.fillForm(randomEmail, tag);

    await expect(page.getByText('Mot de passe fort ✅')).toBeVisible();

    await registerPage.submit();

    const errorAlert = page.locator('.MuiAlert-root');
    if (await errorAlert.isVisible({ timeout: 5000 }).catch(() => false)) {
      const errorText = await errorAlert.textContent();
      console.error('Registration failed with error:', errorText);
      throw new Error(`Registration failed: ${errorText}`);
    }

    await expect(page).toHaveURL(/.*login/, { timeout: 30000 });
  });

  test('should keep register button disabled if password is weak', async ({ page }) => {
    await page.goto('/register');
    await page.locator('input[type="password"]').fill('123');
    await expect(page.getByText('Mot de passe faible ❌')).toBeVisible();
    await expect(
      page.getByRole('button', { name: "S'inscrire" }),
    ).toBeDisabled();
  });
});