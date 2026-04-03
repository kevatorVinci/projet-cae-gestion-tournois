import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';

const PASSWORD = 'ComplexPass123!';

async function registerAndLogin(page: Page, email: string, tag: string) {
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);

  await registerPage.navigate();
  await registerPage.fillForm(email, tag);
  await registerPage.submit();

  await expect(page).toHaveURL(/.*login/, { timeout: 15000 });

  await loginPage.login(email, PASSWORD);
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

async function goToProfile(page: Page) {
  // Click profile avatar in navbar
  await page.locator('button:has-text("Se déconnecter")').waitFor(); // ensure logged in UI
 await page.locator('button:has(.MuiAvatar-root)').click();

}

async function goToDisponibilites(page: Page) {
  // Click "Mes indisponibilités"
  await page.getByRole('button', { name: /mes indisponibilités/i }).click();

  // Wait page load
  await expect(
    page.getByText(/mes indisponibilités/i)
  ).toBeVisible();
}

test.describe('Disponibilites Page', () => {
  test('should navigate to disponibilites page from profile', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `User_${faker.string.alphanumeric(5)}`;

    await registerAndLogin(page, email, tag);

    await goToProfile(page);
    await goToDisponibilites(page);

    await expect(
      page.getByText(/mes indisponibilités/i)
    ).toBeVisible();
  });

  test('should show empty state when no periods', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `User_${faker.string.alphanumeric(5)}`;

    await registerAndLogin(page, email, tag);

    await goToProfile(page);
    await goToDisponibilites(page);

    await expect(
      page.getByText(/aucune indisponibilité/i)
    ).toBeVisible();
  });

  test('should show validation error when dates are missing', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `User_${faker.string.alphanumeric(5)}`;

    await registerAndLogin(page, email, tag);

    await goToProfile(page);
    await goToDisponibilites(page);

    await page.getByRole('button', { name: /ajouter/i }).click();

    await expect(
      page.getByText(/veuillez sélectionner/i)
    ).toBeVisible();
  });

  test('should add a period successfully', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `User_${faker.string.alphanumeric(5)}`;

    await registerAndLogin(page, email, tag);

    await goToProfile(page);
    await goToDisponibilites(page);

    // Open date pickers (MUI tricky part)
    const inputs = page.locator('input');
    
    /// Start date
    await page.getByRole('spinbutton', { name: 'Day' }).nth(0).fill('10');
    await page.getByRole('spinbutton', { name: 'Month' }).nth(0).fill('05');
    await page.getByRole('spinbutton', { name: 'Year' }).nth(0).fill('2026');

    // End date
    await page.getByRole('spinbutton', { name: 'Day' }).nth(1).fill('12');
    await page.getByRole('spinbutton', { name: 'Month' }).nth(1).fill('05');
    await page.getByRole('spinbutton', { name: 'Year' }).nth(1).fill('2026');

    await page.getByRole('button', { name: /ajouter/i }).click();

    await page.getByRole('button', { name: /ajouter/i }).click();

    // Wait list update
    await expect(
      page.getByText(/du .* au/i)
    ).toBeVisible();
  });

  test('should delete a period', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `User_${faker.string.alphanumeric(5)}`;

    await registerAndLogin(page, email, tag);

    await goToProfile(page);
    await goToDisponibilites(page);

    const inputs = page.locator('input');

    // Start date
    await page.getByRole('spinbutton', { name: 'Day' }).nth(0).fill('10');
    await page.getByRole('spinbutton', { name: 'Month' }).nth(0).fill('06');
    await page.getByRole('spinbutton', { name: 'Year' }).nth(0).fill('2026');

    // End date
    await page.getByRole('spinbutton', { name: 'Day' }).nth(1).fill('20');
    await page.getByRole('spinbutton', { name: 'Month' }).nth(1).fill('06');
    await page.getByRole('spinbutton', { name: 'Year' }).nth(1).fill('2026');


    await page.getByRole('button', { name: /ajouter/i }).click();

    const periodItem = page.getByText(/du .* au/i);
    await expect(periodItem).toBeVisible();

    // Click delete button (trash icon)
    await page.locator('button svg[data-testid="DeleteIcon"]').click();

    // Ensure it's gone
    await expect(periodItem).not.toBeVisible();
  });
});