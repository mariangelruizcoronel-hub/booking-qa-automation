import { Page, Locator, expect } from '@playwright/test';

/** Backoffice: login y bandeja de mensajes (equivale al área interna de siniestros/consultas). */
export class AdminPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.loginButton = page.locator('#doLogin');
  }

  async login(user: string, pass: string) {
    await this.page.goto('/admin');
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.loginButton.click();
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/\/admin\/rooms/);
    await expect(this.page.getByRole('button', { name: 'Logout' })).toBeVisible();
  }

  async openMessages() {
    await this.page.goto('/admin/message');
  }

  messageRowWithSubject(subject: string): Locator {
    return this.page.locator('[data-testid^="messageDescription"]', { hasText: subject });
  }
}
