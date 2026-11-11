import { Page, Locator, expect } from '@playwright/test';
import { toPickerFormat } from '../data/factories';
import { MessagePayload } from '../data/factories';

/**
 * Home: buscador de disponibilidad (equivale al COTIZADOR de Heymondo),
 * listado de habitaciones (equivale a los PLANES) y formulario de contacto.
 * Selectores por rol / label / data-testid: nada de XPath ni clases CSS frágiles.
 */
export class HomePage {
  readonly checkAvailabilityButton: Locator;
  readonly roomsSection: Locator;
  readonly bookNowLinks: Locator;
  readonly contactSection: Locator;

  constructor(private readonly page: Page) {
    this.checkAvailabilityButton = page.getByRole('button', { name: 'Check Availability' });
    this.roomsSection = page.locator('#rooms');
    this.bookNowLinks = this.roomsSection.getByRole('link', { name: 'Book now' });
    this.contactSection = page.locator('#contact');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.checkAvailabilityButton).toBeVisible();
  }

  /** Los datepickers no tienen label asociado al input: los localizamos dentro de la sección de búsqueda. */
  private dateInputs() {
    return this.page.locator('#booking').getByRole('textbox');
  }

  async searchAvailability(checkin: string, checkout: string) {
    const [checkinInput, checkoutInput] = [this.dateInputs().nth(0), this.dateInputs().nth(1)];
    await checkinInput.fill(toPickerFormat(checkin));
    await checkinInput.press('Escape');
    await checkoutInput.fill(toPickerFormat(checkout));
    await checkoutInput.press('Escape');
    await this.checkAvailabilityButton.click();
  }

  async openFirstAvailableRoom() {
    await expect(this.bookNowLinks.first()).toBeVisible();
    await this.bookNowLinks.first().click();
  }

  async sendContactMessage(msg: MessagePayload) {
    const s = this.contactSection;
    await s.getByTestId('ContactName').fill(msg.name);
    await s.getByTestId('ContactEmail').fill(msg.email);
    await s.getByTestId('ContactPhone').fill(msg.phone);
    await s.getByTestId('ContactSubject').fill(msg.subject);
    await s.getByTestId('ContactDescription').fill(msg.description);
    await s.getByRole('button', { name: 'Submit' }).click();
  }
}
