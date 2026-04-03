import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { LoginPage } from '../../pages/LoginPage';
import { TournamentPage } from '../../pages/TournamentPage';

const ADMIN_EMAIL = 'lea@mail.com';
const ADMIN_PASSWORD = 'Azerty2026!';

async function dismissViteOverlay(page: Page) {
  await page.keyboard.press('Escape');
  const overlay = page.locator('vite-plugin-checker-error-overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.evaluate((el) => el.remove());
  }
}

async function loginAsAdmin(page: Page) {
  let loginPage = new LoginPage(page);
  await loginPage.navigate();
  await dismissViteOverlay(page);
  await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

// Generates future dates for the tournament form
function getFutureDates() {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 5);

  const start = new Date();
  start.setDate(start.getDate() + 10);

  const end = new Date();
  end.setDate(end.getDate() + 15);

  const format = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  return {
    deadline: format(deadline),
    start: format(start),
    end: format(end),
  };
}

test.describe('Edit Tournament', () => {
  test('should create a tournament then edit its description', async ({ page }) => {
    const tournamentPage = new TournamentPage(page);
    const tournamentName = `TestTournoi_${faker.string.alphanumeric(5)}`;
    const updatedDescription = `Updated description ${faker.string.alphanumeric(8)}`;
    const dates = getFutureDates();

    // 1. Login as admin
    await loginAsAdmin(page);
    await dismissViteOverlay(page);

    // 2. Switch to admin view
    await tournamentPage.switchToAdminView();

    // 3. Go to tournament management
    await tournamentPage.goToTournamentManagement();
    await expect(page.getByText(/gestion des tournois/i)).toBeVisible();

    // 4. Create a new tournament
    await tournamentPage.clickCreateNew();
    await page.waitForSelector('input', { state: 'visible' });

    await tournamentPage.fillCreateForm({
      name: tournamentName,
      description: 'Initial description for testing',
      participants: 8,
      deadlineDate: dates.deadline,
      startDate: dates.start,
      endDate: dates.end,
    });

    await tournamentPage.submitSave();

    await expect(page).toHaveURL(/.*admin\/tournaments/, { timeout: 15000 });

    // 5. Find the newly created tournament and click Modifier
    await expect(page.getByText(tournamentName)).toBeVisible({ timeout: 10000 });
    await tournamentPage.clickModifierOnTournament(tournamentName);

    // 6. Edit the description
    await page.waitForSelector('textarea', { state: 'visible' });
    await tournamentPage.fillEditForm({ description: updatedDescription });

    // 7. Save the changes
    await tournamentPage.submitEdit();

    // 8. Should show success message and redirect
    await expect(page.locator('.MuiAlert-root')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.MuiAlert-root')).toContainText(/modifié avec succès/i);
  });

  test('should show error when end date is before start date', async ({ page }) => {
    const tournamentPage = new TournamentPage(page);
    const tournamentName = `TestTournoi_${faker.string.alphanumeric(5)}`;
    const dates = getFutureDates();

    await loginAsAdmin(page);
    await dismissViteOverlay(page);

    await tournamentPage.switchToAdminView();
    await tournamentPage.goToTournamentManagement();
    await tournamentPage.clickCreateNew();
    await page.waitForSelector('input', { state: 'visible' });

    await tournamentPage.fillCreateForm({
      name: tournamentName,
      description: 'Test description',
      participants: 4,
      deadlineDate: dates.deadline,
      startDate: dates.start,
      endDate: dates.end,
    });

    await tournamentPage.submitSave();
    await expect(page).toHaveURL(/.*admin\/tournaments/, { timeout: 15000 });

    await expect(page.getByText(tournamentName)).toBeVisible({ timeout: 10000 });
    await tournamentPage.clickModifierOnTournament(tournamentName);

    await page.waitForSelector('textarea', { state: 'visible' });

    // Set end date BEFORE start date to trigger validation error
    const startField = page.getByLabel(/date de début/i);
    const endField = page.getByLabel(/date de fin/i);

    // Clear end date and set it before start date
    await endField.fill(dates.deadline); // deadline is before start

    await tournamentPage.submitEdit();

    // Should show error alert
    await expect(page.locator('.MuiAlert-colorError')).toBeVisible({ timeout: 10000 });
  });

  test('should display existing tournament data when editing', async ({ page }) => {
    const tournamentPage = new TournamentPage(page);
    const tournamentName = `TestTournoi_${faker.string.alphanumeric(5)}`;
    const dates = getFutureDates();

    await loginAsAdmin(page);
    await dismissViteOverlay(page);

    await tournamentPage.switchToAdminView();
    await tournamentPage.goToTournamentManagement();
    await tournamentPage.clickCreateNew();
    await page.waitForSelector('input', { state: 'visible' });

    await tournamentPage.fillCreateForm({
      name: tournamentName,
      description: 'Pre-filled description to verify',
      participants: 6,
      deadlineDate: dates.deadline,
      startDate: dates.start,
      endDate: dates.end,
    });

    await tournamentPage.submitSave();
    await expect(page).toHaveURL(/.*admin\/tournaments/, { timeout: 15000 });

    await expect(page.getByText(tournamentName)).toBeVisible({ timeout: 10000 });
    await tournamentPage.clickModifierOnTournament(tournamentName);

    await page.waitForSelector('textarea', { state: 'visible' });

    // Verify the form is pre-filled with existing data
    await expect(page.locator('textarea').first()).toContainText('Pre-filled description to verify');
    await expect(page.getByText(/modifier le tournoi/i)).toBeVisible();
  });
});