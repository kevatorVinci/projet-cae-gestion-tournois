import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const VALID_EMAIL = 'lea@mail.com';
const VALID_PASSWORD = 'Azerty2026!';

test.describe('Login Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should login successfully and redirect to home', async ({ page }) => {
    await loginPage.login(VALID_EMAIL, VALID_PASSWORD);
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should show error on wrong credentials', async ({ page }) => {
    await loginPage.login('wrong@mail.com', 'wrongpassword');
    await expect(page.getByText(/informations incorrectes/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await expect(loginPage.passwordInput).toBeVisible();

    await loginPage.togglePasswordVisibility();
    await expect(page.locator('input[type="text"]')).toBeVisible();

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('should remember me checkbox be toggleable', async ({ page }) => {
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
    await loginPage.rememberMeCheckbox.click();
    await expect(loginPage.rememberMeCheckbox).toBeChecked();
  });

  test('should not submit with empty fields', async ({ page }) => {
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/.*login/);
  });
});