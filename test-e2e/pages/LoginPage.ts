import { Page, expect, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly togglePasswordBtn: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]'); //ewfwsrbwre
    this.loginButton = page.getByRole('button', { name: /se connecter/i });
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]');
    this.togglePasswordBtn = page.locator('.MuiInputAdornment-root button');
    this.errorAlert = page.locator('.MuiAlert-root');
  }

  async navigate() {
    await this.page.goto('/login');
    await this.page.waitForSelector('input[type="email"]', { state: 'visible' });
  }

  async login(email: string, pass: string, rememberMe: boolean = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    await this.loginButton.click();
  }

  async togglePasswordVisibility() {
    await this.togglePasswordBtn.click();
  }

  async getErrorMessage() {
    return await this.errorAlert.textContent();
  }
}