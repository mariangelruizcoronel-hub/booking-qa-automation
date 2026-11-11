import { Given, When, Then, expect } from '../../src/fixtures/fixtures';
import { buildBooking, futureStay } from '../../src/data/factories';

/**
 * Steps de Gherkin: reutilizan los mismos Page Objects y fixtures que los tests .spec.ts.
 * Así el .feature es documentación viva Y test ejecutable, sin duplicar código.
 */

let lastBookingStatus: number | undefined;

Given('hay una habitación disponible para {int} noches', async ({ reservationPage }, nights: number) => {
  await reservationPage.goto(1, futureStay(nights));
});

When('introduzco mis datos de huésped válidos', async ({ reservationPage }) => {
  await reservationPage.startReservation();
  await reservationPage.fillGuest(buildBooking());
});

When(
  'introduzco el nombre {string} y el resto de datos válidos',
  async ({ reservationPage }, nombre: string) => {
    await reservationPage.startReservation();
    await reservationPage.fillGuest({ ...buildBooking(), firstname: nombre });
  },
);

When('confirmo la reserva', async ({ reservationPage, page }) => {
  const response = page.waitForResponse(
    (r) => r.url().includes('/api/booking') && r.request().method() === 'POST',
  );
  await reservationPage.confirm();
  lastBookingStatus = (await response).status();
});

Then('veo que la reserva está confirmada', async ({ reservationPage }) => {
  await expect(reservationPage.confirmation).toBeVisible();
});

Then('el resultado de la reserva es {string}', async ({ reservationPage }, resultado: string) => {
  if (resultado === 'confirmada') {
    expect(lastBookingStatus).toBe(201);
    await expect(reservationPage.confirmation).toBeVisible();
  } else {
    expect(lastBookingStatus).toBe(400);
    await expect(reservationPage.confirmation).toBeHidden();
  }
});

Then(
  'el total es el precio por noche por {int} noches más {int} de tasas',
  async ({ reservationPage, api }, nights: number, fees: number) => {
    const room = await (await api.getRoom(1)).json();
    expect(await reservationPage.totalPrice()).toBe(room.roomPrice * nights + fees);
  },
);
