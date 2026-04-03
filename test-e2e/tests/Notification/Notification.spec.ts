import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';

const PASSWORD = 'ComplexPass123!';

async function dismissViteOverlay(page: Page) {
  await page.keyboard.press('Escape');
  const overlay = page.locator('vite-plugin-checker-error-overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.evaluate((el) => el.remove());
  }
}

async function registerAndLogin(page: Page, email: string, tag: string) {
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);

  // 1. Register
  await registerPage.navigate();
  await dismissViteOverlay(page);
  await registerPage.fillForm(email, tag);
  await registerPage.submit();
  await expect(page).toHaveURL(/.*login/, { timeout: 15000 });

  // 2. Login
  await page.waitForSelector('input[type="email"]', { state: 'visible' });
  await dismissViteOverlay(page);
  await loginPage.login(email, PASSWORD);
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

test.describe('Notifications Page', () => {
  let userEmail: string;
  let userTag: string;

  test.beforeEach(async ({ page }) => {
    userEmail = faker.internet.email().toLowerCase();
    userTag = `Notif_${faker.string.alphanumeric(4)}`;
    await registerAndLogin(page, userEmail, userTag);
  });

  test('should navigate to notifications page from navbar', async ({ page }) => {
    await page.locator('[aria-label="notifications"]').click({ force: true });

    await expect(page).toHaveURL(/.*notifications/, { timeout: 10000 });

    // FIX: use role instead of ambiguous text
    await expect(
      page.getByRole('heading', { name: /notifications/i })
    ).toBeVisible();
  });

  test('should display welcome notification after registration', async ({ page }) => {
    await page.goto('/notifications');

    await page.waitForSelector('.MuiCard-root', {
      state: 'visible',
      timeout: 10000,
    });

    const cards = page.locator('.MuiCard-root');
    await expect(cards.first()).toBeVisible();
  });

  test('should display all three tabs', async ({ page }) => {
    await page.goto('/notifications');

    await expect(page.getByRole('tab', { name: /toutes/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /non lues/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /historique/i })).toBeVisible();
  });

  test('should show unread count chip when there are unread notifications', async ({ page }) => {
    await page.goto('/notifications');

    await expect(
      page.locator('.MuiChip-root', { hasText: /nouvelles/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should filter to show only unread notifications in Non lues tab', async ({ page }) => {
    await page.goto('/notifications');

    await page.waitForSelector('.MuiCard-root', {
      state: 'visible',
      timeout: 10000,
    });

    await page.getByRole('tab', { name: /non lues/i }).click();

    const cards = page.locator('.MuiCard-root');
    await expect(cards.first()).toBeVisible();
  });

  test('should show no unread notifications in Historique tab initially', async ({ page }) => {
    await page.goto('/notifications');

    await page.getByRole('tab', { name: /historique/i }).click();

    await expect(
      page.getByText(/aucune notification/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show notifications in Historique tab after marking all as read', async ({ page }) => {
    await page.goto('/notifications');

    await page.waitForSelector('.MuiCard-root', {
      state: 'visible',
      timeout: 10000,
    });

    // Click "mark all as read"
    await page.getByRole('button', { name: /tout marquer comme lu/i }).click({ force: true });

    // ✅ Check unread chip disappears
    await expect(
    page.locator('.MuiChip-root', { hasText: /nouvelles/i })
    ).not.toBeVisible();

    // ✅ Go to "Non lues" tab → should be empty
    await page.getByRole('tab', { name: /non lues/i }).click();
    await expect(
    page.getByText(/aucune notification/i)
    ).toBeVisible();

    // ✅ Go to "Historique" → should contain notifications
    await page.getByRole('tab', { name: /historique/i }).click();
    await expect(page.locator('.MuiCard-root').first()).toBeVisible();

    const cards = page.locator('.MuiCard-root');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter notifications by type using the dropdown', async ({ page }) => {
    await page.goto('/notifications');

    await page.waitForSelector('.MuiCard-root', {
      state: 'visible',
      timeout: 10000,
    });

    // Open dropdown
    await page.locator('.MuiSelect-select').first().click();
    await page.waitForSelector('[role="option"]', { timeout: 10000 });

    // Select filter
    await page.getByRole('option', { name: /demandes/i }).click();

    await expect(
      page.getByText(/aucune notification/i)
    ).toBeVisible({ timeout: 10000 });
  });
});