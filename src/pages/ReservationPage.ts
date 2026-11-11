import { Page, Locator, expect } from '@playwright/test';
import { BookingDates } from '../data/factories';

export interface GuestDetails {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
}

/**
 * Página de reserva de una habitación: resumen de precio + datos del huésped + confirmación.
 * Equivale al CHECKOUT de Heymondo (datos del viajero -> pago -> póliza emitida).
 */
export class ReservationPage {
  readonly reserveButton: Locator;
  readonly firstname: Locator;
  readonly lastname: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly confirmation: Locator;
  readonly errorAlert: Locator;
  readonly priceSummary: Locator;

  constructor(private readonly page: Page) {
    this.reserveButton = page.getByRole('button', { name: 'Reserve Now' });
    this.firstname = page.getByPlaceholder('Firstname');
    this.lastname = page.getByPlaceholder('Lastname');
    this.email = page.getByPlaceholder('Email');
    this.phone = page.getByPlaceholder('Phone');
    this.confirmation = page.getByRole('heading', { name: 'Booking Confirmed' });
    this.errorAlert = page.locator('.alert-danger');
    this.priceSummary = page.getByRole('heading', { name: 'Price Summary' }).locator('..');
  }

  /** Entrar directamente con fechas en la URL: técnica para preparar el estado sin pasar por la UI. */
  async goto(roomId: number, dates: BookingDates) {
    await this.page.goto(`/reservation/${roomId}?checkin=${dates.checkin}&checkout=${dates.checkout}`);
    await expect(this.reserveButton).toBeVisible();
  }

  async startReservation() {
    await this.reserveButton.click();
    await expect(this.firstname).toBeVisible();
  }

  async fillGuest(guest: Partial<GuestDetails>) {
    if (guest.firstname !== undefined) await this.firstname.fill(guest.firstname);
    if (guest.lastname !== undefined) await this.lastname.fill(guest.lastname);
    if (guest.email !== undefined) await this.email.fill(guest.email);
    if (guest.phone !== undefined) await this.phone.fill(guest.phone);
  }

  async confirm() {
    await this.reserveButton.click();
  }

  /** Total = precio/noche x noches + 25 (limpieza) + 15 (servicio) */
  async totalPrice(): Promise<number> {
    const totalRow = this.priceSummary.locator('.fw-bold', { hasText: 'Total' });
    const text = await totalRow.locator('span').last().innerText();
    return Number(text.replace(/[^\d.]/g, ''));
  }
}
