import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { AdminUserPage } from '../../pages/AdminPage';

const ADMIN_EMAIL = 'lea@mail.com';
const ADMIN_PASSWORD = 'Azerty2026!';
const USER_TO_BAN = 'zoe@mail.com'; 

async function dismissViteOverlay(page: Page) {
  await page.keyboard.press('Escape');
  const overlay = page.locator('vite-plugin-checker-error-overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.evaluate((el) => el.remove());
  }
}

async function loginAsAdmin(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await dismissViteOverlay(page);
  await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

test.describe('AdminPage', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const adminPage = new AdminUserPage(page);
    await adminPage.navigateToAdminView();
  });

  test('should display admin page title and user table', async ({ page }) => {
    await expect(
      page.getByText(/gestion des administrateurs/i)
    ).toBeVisible();
    await expect(
      page.getByPlaceholder(/chercher un joueur/i)
    ).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should show Vous-même for the logged in admin', async ({ page }) => {
    await expect(page.getByText(/vous-même/i)).toBeVisible();
  });

  test('should filter users by search term', async ({ page }) => {
    const adminPage = new AdminUserPage(page);
    await adminPage.searchUser('lea');
    await expect(page.getByText('lea@mail.com')).toBeVisible();
  });

  test('should show Nommer Admin and Bannir buttons for regular users', async ({ page }) => {
    const adminPage = new AdminUserPage(page);
    await adminPage.searchUser(USER_TO_BAN);

    await page.waitForTimeout(500);

    await expect(
      page.getByRole('button', { name: /nommer admin/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('button', { name: /bannir/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should ban user and show success message', async ({ page }) => {
    const adminPage = new AdminUserPage(page);
    await adminPage.searchUser(USER_TO_BAN);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /bannir/i }).click({ force: true });
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByPlaceholder(/raison du bannissement/i).fill('Test ban - automated test');
    await page.getByRole('button', { name: /confirmer le ban/i }).click({ force: true });

    await expect(page.locator('.MuiAlert-root')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.MuiAlert-root')).toContainText(/banni/i);

    // Verify user now shows as banned
    await adminPage.searchUser(USER_TO_BAN);
    await expect(page.getByText(/compte banni/i)).toBeVisible({ timeout: 10000 });
  });

  test('should switch back to player view when clicking Vue Joueur', async ({ page }) => {
    const adminPage = new AdminUserPage(page);
    await adminPage.switchToPlayerView();
    await expect(page.getByRole('button', { name: /accueil/i })).toBeVisible();
  });
});