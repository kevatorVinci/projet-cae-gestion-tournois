import { test, expect } from '@playwright/test';

test.describe('Teams List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/equipes');
    // Wait for loading spinner to disappear
    await expect(page.locator('[role="progressbar"]')).not.toBeVisible({ timeout: 15000 });
  });

  test('should display the page title and search bar', async ({ page }) => {
    await expect(page.getByText('Annuaire Vinci Arena')).toBeVisible();
    await expect(page.getByPlaceholder('Rechercher par nom...')).toBeVisible();
  });

  test('should display team cards with details and postuler buttons', async ({ page }) => {
    // At least one card should be visible
    await expect(page.locator('.MuiCard-root').first()).toBeVisible();

    // Voir les détails button should be visible
    await expect(page.getByRole('button', { name: /voir les détails/i }).first()).toBeVisible();

    // Postuler button should be visible
    await expect(page.getByRole('button', { name: /postuler/i }).first()).toBeVisible();
  });

  test('should filter teams by name', async ({ page }) => {
    const searchBar = page.getByPlaceholder('Rechercher par nom...');
    await searchBar.fill('TEAM_ALPHA');

    // TEAM_ALPHA should be visible
    await expect(page.getByText('TEAM_ALPHA')).toBeVisible();

    // Counter should update
    await expect(page.getByText(/\(\d+ \/ \d+\)/)).toBeVisible();
  });

  test('should show no results when searching for unknown team', async ({ page }) => {
    const searchBar = page.getByPlaceholder('Rechercher par nom...');
    await searchBar.fill('ZZZZZZZZZUNKNOWNTEAM');

    await expect(page.getByText(/aucune équipe trouvée/i)).toBeVisible();
  });

  test('should navigate to team details when clicking voir les détails', async ({ page }) => {
    await page.getByRole('button', { name: /voir les détails/i }).first().click();
    await expect(page).toHaveURL(/.*equipes\/\d+/, { timeout: 10000 });
  });

  test('should redirect to login when clicking postuler while not logged in', async ({ page }) => {
    await page.getByRole('button', { name: /postuler/i }).first().click();
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should show loading spinner initially', async ({ page }) => {
    // Intercept the API to delay it
    await page.route('**/api/equipes**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/equipes');
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).not.toBeVisible({ timeout: 15000 });
  });
});