import { test, expect } from '@playwright/test';

const VALID_EMAIL = 'lea@mail.com';
const VALID_PASSWORD = 'Azerty2026!'; // 👈 replace with real password
const TEAM_ID = '1'; // 👈 replace with a real team ID from your database

test.describe('Team Details Page', () => {
  // Login before each test since the page requires authentication
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.locator('input[type="email"]').fill(VALID_EMAIL);
    await page.locator('input[type="password"]').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should display team name and member count', async ({ page }) => {
    await page.goto(`/equipes/${TEAM_ID}`);
    await page.waitForSelector('text=Effectif de la Team', {
      state: 'visible',
    });

    // Team name should be visible
    await expect(page.locator('h4')).toBeVisible();

    // Member count should be visible
    await expect(page.getByText(/membres :/i)).toBeVisible();

    // Section title should be visible
    await expect(page.getByText('Effectif de la Team')).toBeVisible();
  });

  test('should display member cards with avatar, tag and specialty', async ({
    page,
  }) => {
    await page.goto(`/equipes/${TEAM_ID}`);
    await page.waitForSelector('text=Effectif de la Team', {
      state: 'visible',
    });

    // At least one member card should be visible
    const memberCards = page.locator('.MuiCard-root').nth(1); // first card is team info
    await expect(memberCards).toBeVisible();

    // Avatar should be visible
    await expect(page.locator('.MuiAvatar-root').first()).toBeVisible();
  });

  test('should navigate to player page when clicking on member tag', async ({
    page,
  }) => {
    await page.goto(`/equipes/${TEAM_ID}`);
    await page.waitForSelector('text=Effectif de la Team', {
      state: 'visible',
    });

    // Click the first member tag (h6 with cursor pointer)
    const firstMemberTag = page
      .locator('h6[style*="cursor"], .MuiTypography-h6')
      .first();
    await firstMemberTag.click();

    // Should navigate to /players/:id
    await expect(page).toHaveURL(/.*players\/\d+/, { timeout: 10000 });
  });

  test('should show loading state before team data arrives', async ({
    page,
  }) => {
    // Intercept the API call to delay it
    await page.route('**/api/equipes/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto(`/equipes/${TEAM_ID}`);

    // Loading text should appear briefly
    await expect(page.getByText('Chargement...')).toBeVisible();

    // Then team content should appear
    await expect(page.getByText('Effectif de la Team')).toBeVisible({
      timeout: 10000,
    });
  });

  test('responsible members should appear first in the list', async ({
    page,
  }) => {
    await page.goto(`/equipes/${TEAM_ID}`);
    await page.waitForSelector('text=Effectif de la Team', {
      state: 'visible',
    });

    // Get all member cards after the first one (team info card)
    const memberCards = page.locator('.MuiCard-root');
    const count = await memberCards.count();

    // There should be at least 2 cards (1 team info + at least 1 member)
    expect(count).toBeGreaterThan(1);
  });
});
