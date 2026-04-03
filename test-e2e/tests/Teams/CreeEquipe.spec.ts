import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';
import { TeamPage } from '../../pages/TeamPage';

test.describe('Team Management', () => {
  let registerPage: RegisterPage;
  let loginPage: LoginPage;
  let teamPage: TeamPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    loginPage = new LoginPage(page);
    teamPage = new TeamPage(page);
  });

  
  test('New user can register and create a team', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `Hero_${faker.string.alphanumeric(4)}`;
    const teamName = `Squad_${faker.string.alphanumeric(5)}`;

    // 1. Registration
    await registerPage.navigate();
    await registerPage.fillForm(email, tag);
    await registerPage.submit();
    await expect(page).toHaveURL(/.*login/, { timeout: 15000 });

    // 2. Login
    await loginPage.login(email, 'ComplexPass123!');
    
    // Wait for Home page to settle to ensure session is saved
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Accueil' })).toBeVisible();

    // 3. Team Creation
    await teamPage.navigate(); 
    await expect(page).toHaveURL(/\/equipes\/creer$/);

    
    // Guard: Ensure header is visible before interacting with the form
    await expect(page.getByText(/Créer une Team/i)).toBeVisible();
    await teamPage.createTeamFullFlow(teamName);

    // 4. Verification
    await expect(page).toHaveURL(/\/maTeam/);
    await expect(page.getByText(teamName)).toBeVisible();
  });
});
