import { test, expect } from '@playwright/test';

const VALID_EMAIL = 'lea@mail.com';
const VALID_PASSWORD = 'Azerty2026!';

test.describe('Login Flow', () => {
  test('should login successfully and redirect to home', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });

    await page.locator('input[type="email"]').fill(VALID_EMAIL);
    await page.locator('input[type="password"]').fill(VALID_PASSWORD);

    await page.getByRole('button', { name: /se connecter/i }).click();

    const errorAlert = page.locator('.MuiAlert-root');
    const hasError = await errorAlert.isVisible().catch(() => false);
    if (hasError) {
      console.log('Login error:', await errorAlert.textContent());
    }

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should show error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });

    await page.locator('input[type="email"]').fill('wrong@mail.com');
    await page.locator('input[type="password"]').fill('wrongpassword');

    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page.getByText(/identifiants incorrects/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="password"]', { state: 'visible' });

    // Target the IconButton inside the password field adornment
    const toggleBtn = page.locator('.MuiInputAdornment-root button');
    await expect(toggleBtn).toBeVisible();

    // Password should be hidden by default
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Click to show password
    await toggleBtn.click();
    await expect(page.locator('input[type="text"]')).toBeVisible();

    // Click again to hide
    await toggleBtn.click();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should remember me checkbox be toggleable', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="checkbox"]', { state: 'visible' });

    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('should not submit with empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });

    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/.*login/);
  });
});
