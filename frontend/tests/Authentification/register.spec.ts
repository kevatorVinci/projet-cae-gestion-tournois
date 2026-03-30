import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Registration Flow', () => {
  test('should register a new user with a strong password and avatar', async ({
    page,
  }) => {
    const randomEmail = faker.internet.email();
    const strongPassword = 'ComplexPass123!'; // Meets all 5 criteria in your code
    const tag = faker.person.firstName();

    // 1. Navigate to register page
    await page.goto('/register');

    // 2. Fill in the form [cite: 594, 595]
    await page.getByLabel('Email').fill(randomEmail);
    await page.getByLabel('Mot de passe', { exact: true }).fill(strongPassword);
    await page.getByLabel('Tag (Pseudo)').fill(tag);

    // 3. Select a Specialty from the MUI Select [cite: 593]
    await page.getByLabel('Spécialité').click();
    await page.getByRole('option', { name: 'Architecte' }).click();

    // 4. Choose an avatar (Crucial: your code requires profileImage)
    const firstAvatar = page.locator('img[alt="Avatar 0"]');
    await firstAvatar.click();

    // 5. Verify the strength indicator and button state
    await expect(page.getByText('Mot de passe fort ✅')).toBeVisible();
    const submitBtn = page.getByRole('button', { name: "S'inscrire" });
    await expect(submitBtn).toBeEnabled();

    // 6. Submit and check redirection [cite: 590, 591]
    await submitBtn.click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should keep register button disabled if password is weak', async ({
    page,
  }) => {
    await page.goto('/register');

    // Fill with a simple password
    await page.getByLabel('Mot de passe', { exact: true }).fill('123');

    // Check for "Faible" label and disabled button
    await expect(page.getByText('Mot de passe faible ❌')).toBeVisible();
    await expect(
      page.getByRole('button', { name: "S'inscrire" }),
    ).toBeDisabled();
  });
});
