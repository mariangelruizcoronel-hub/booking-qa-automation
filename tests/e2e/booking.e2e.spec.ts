import { test, expect } from '../../src/fixtures/fixtures';
import { buildBooking, futureStay } from '../../src/data/factories';

/**
 * Flujo crítico de negocio: buscar -> elegir -> datos del huésped -> confirmar.
 * En Heymondo sería: cotizar -> elegir plan -> datos del viajero -> pagar -> póliza emitida.
 * En E2E solo los flujos críticos: pocos tests, muy buenos.
 */
test.describe('Reserva E2E @e2e', () => {
  test('el usuario reserva una habitación de principio a fin @smoke @mobile', async ({
    reservationPage,
    page,
  }) => {
    const guest = buildBooking();
    const dates = futureStay(2);

    await test.step('abrir la habitación con fechas', async () => {
      await reservationPage.goto(1, dates);
    });

    await test.step('rellenar datos del huésped', async () => {
      await reservationPage.startReservation();
      await reservationPage.fillGuest(guest);
    });

    await test.step('confirmar y verificar respuesta del backend', async () => {
      const bookingResponse = page.waitForResponse(
        (r) => r.url().includes('/api/booking') && r.request().method() === 'POST',
      );
      await reservationPage.confirm();
      expect((await bookingResponse).status()).toBe(201);
      await expect(reservationPage.confirmation).toBeVisible();
    });
  });

  test('buscar disponibilidad muestra habitaciones con enlace de reserva', async ({ homePage, page }) => {
    const dates = futureStay(3);
    await homePage.goto();

    const searchResponse = page.waitForResponse((r) => r.url().includes('/api/room?checkin='));
    await homePage.searchAvailability(dates.checkin, dates.checkout);
    expect((await searchResponse).ok()).toBeTruthy();

    await expect(homePage.bookNowLinks.first()).toBeVisible();
    await expect(homePage.bookNowLinks.first()).toHaveAttribute('href', /\/reservation\/\d+/);
  });

  test('el resumen de precio suma noches + tasas (regla de negocio)', async ({ reservationPage, api }) => {
    const room = (await (await api.getRoom(1)).json()) as { roomPrice: number };
    const nights = 3;

    await reservationPage.goto(1, futureStay(nights));

    // 25 limpieza + 15 servicio
    expect(await reservationPage.totalPrice()).toBe(room.roomPrice * nights + 40);
  });

  test('no confirma la reserva si faltan datos obligatorios', async ({ reservationPage, page }) => {
    await reservationPage.goto(1, futureStay());
    await reservationPage.startReservation();
    await reservationPage.fillGuest({ firstname: 'Al' }); // 2 caracteres: por debajo del mínimo

    const bookingResponse = page.waitForResponse((r) => r.url().includes('/api/booking'));
    await reservationPage.confirm();

    expect((await bookingResponse).status()).toBe(400);
    await expect(reservationPage.confirmation).toBeHidden();
  });

  /**
   * MOCK con page.route: simulamos que el backend falla (500) sin depender de que falle de verdad.
   * En Heymondo: simular pasarela de pago caída o tarjeta rechazada.
   */
  test('si el backend de reservas falla, no se muestra una confirmación falsa', async ({
    reservationPage,
    page,
  }) => {
    await page.route('**/api/booking', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, json: { fieldErrors: ['Servicio no disponible'] } })
        : route.continue(),
    );

    await reservationPage.goto(1, futureStay());
    await reservationPage.startReservation();
    await reservationPage.fillGuest(buildBooking());
    await reservationPage.confirm();

    await expect(reservationPage.confirmation).toBeHidden();
  });
});
