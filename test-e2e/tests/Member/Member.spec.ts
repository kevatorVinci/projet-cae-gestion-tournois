import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { RegisterPage } from '../../pages/RegisterPage';
import { LoginPage } from '../../pages/LoginPage';

const PASSWORD = 'ComplexPass123!';

async function registerUser(page: Page, email: string, tag: string) {
  const registerPage = new RegisterPage(page);

  await registerPage.navigate();
  await registerPage.fillForm(email, tag);
  await registerPage.submit();

  await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
}

async function loginUser(page: Page, email: string) {
  const loginPage = new LoginPage(page);

  await loginPage.login(email, PASSWORD);
  await expect(page).toHaveURL('/', { timeout: 15000 });
}

async function goToMemberPage(page: Page, tag: string) {
  await page.goto(`/member/${tag}`);

  // ✅ WAIT for page to actually load (fixes your timeout)
  await page.waitForSelector('text=Informations personnelles', {
    timeout: 10000,
  });
}

test.describe('MemberDetails - Email Privacy', () => {
  test('should show email for own profile', async ({ page }) => {
    const email = faker.internet.email().toLowerCase();
    const tag = `User_${faker.string.alphanumeric(5)}`;

    await registerUser(page, email, tag);
    await loginUser(page, email);

    await goToMemberPage(page, tag);

    // ✅ Check email in the correct section (not global search)
    await expect(
      page.locator('text=Email').locator('..').getByText(email)
    ).toBeVisible();
  });

  test('should show "Privé" for another user profile', async ({ page }) => {
    const emailA = faker.internet.email().toLowerCase();
    const tagA = `UserA_${faker.string.alphanumeric(5)}`;

    const emailB = faker.internet.email().toLowerCase();
    const tagB = `UserB_${faker.string.alphanumeric(5)}`;

    // Register both users
    await registerUser(page, emailA, tagA);
    await registerUser(page, emailB, tagB);

    // Login as user A
    await loginUser(page, emailA);

    await goToMemberPage(page, tagB);

    // ❌ Email should NOT be visible
    await expect(
      page.locator('text=Email').locator('..').getByText(emailB)
    ).not.toBeVisible();

    // ✅ "Privé" should be shown instead
    await expect(
      page.locator('text=Email').locator('..').getByText(/privé/i)
    ).toBeVisible();
  });
});