import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { TeamPage } from '../../pages/TeamPage';

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

  // Wait for redirect to login after registration
  await expect(page).toHaveURL(/.*login/, { timeout: 15000 });

  // 2. Login - no navigate() call since we're already on /login
  await page.waitForSelector('input[type="email"]', { state: 'visible' });
  await dismissViteOverlay(page);
  await loginPage.login(email, PASSWORD);
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

test.describe('CreateEquipe Page', () => {
  test('New user can register and create a team', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `Hero_${faker.string.alphanumeric(4)}`;
    const teamName = `Squad_${faker.string.alphanumeric(5)}`;
    const teamPage = new TeamPage(page);

    await registerAndLogin(page, email, tag);

    await teamPage.navigate();
    await dismissViteOverlay(page);

    await expect(page.getByText(/créer une team/i)).toBeVisible();
    await teamPage.createTeamFullFlow(teamName);

    await expect(page).toHaveURL(/.*maTeam/, { timeout: 15000 });
    await expect(page.getByText(teamName)).toBeVisible();
  });

  test('should show error for existing team name', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `Warn_${faker.string.alphanumeric(4)}`;
    const teamPage = new TeamPage(page);

    await registerAndLogin(page, email, tag);

    await teamPage.navigate();
    await dismissViteOverlay(page);

    await teamPage.fillTeamName('TEAM_ALPHA');
    await teamPage.selectEmblem();
    await teamPage.submit();

    const errorAlert = page.locator('.MuiAlert-root');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    // Match the actual error message from the backend
    await expect(errorAlert).toContainText(/nom d'equipe deja utilise/i);
  });

  test('should have submit button disabled when team name is empty', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `Test_${faker.string.alphanumeric(4)}`;
    const teamPage = new TeamPage(page);

    await registerAndLogin(page, email, tag);

    await teamPage.navigate();
    await dismissViteOverlay(page);
    await page.waitForSelector('input', { state: 'visible' });

    await expect(
      page.getByRole('button', { name: /fonder l'équipe/i })
    ).toBeDisabled();
  });

});