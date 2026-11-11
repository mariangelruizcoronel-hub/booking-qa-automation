import { test, expect } from '../../src/fixtures/fixtures';
import { buildBooking, futureStay } from '../../src/data/factories';

/**
 * API de reservas = el equivalente al endpoint de "emitir póliza".
 * Aquí está la mayor parte de la cobertura: rápido (milisegundos), estable y con muchas combinaciones.
 */
test.describe('API Booking @api', () => {
  test('crear reserva válida devuelve 201 y la reserva @smoke @AC3', async ({ api, createdBookings }) => {
    const payload = buildBooking();

    const res = await api.createBooking(payload);

    expect(res.status()).toBe(201);
    const body = await res.json();
    createdBookings.push(body.bookingid);
    expect(body.bookingid).toEqual(expect.any(Number));
    expect(body).toMatchObject({
      roomid: payload.roomid,
      firstname: payload.firstname,
      lastname: payload.lastname,
      bookingdates: payload.bookingdates,
    });
  });

  test('no permite reservar dos veces las mismas fechas (409) @AC5', async ({ api, createdBookings }) => {
    const dates = futureStay();
    const first = await api.createBooking(buildBooking({ bookingdates: dates }));
    expect(first.status()).toBe(201);
    createdBookings.push((await first.json()).bookingid);

    const duplicate = await api.createBooking(buildBooking({ bookingdates: dates }));

    expect(duplicate.status()).toBe(409);
  });

  test('ver las reservas requiere autenticación (401 sin token, 200 con token) @AC9', async ({
    api,
    adminToken,
    createdBookings,
  }) => {
    const created = await (await api.createBooking(buildBooking())).json();
    createdBookings.push(created.bookingid);

    const anonymous = await api.getBookings(1);
    expect(anonymous.status(), 'sin token').toBe(401);

    const asAdmin = await api.getBookings(1, adminToken);
    expect(asAdmin.status(), 'con token de admin').toBe(200);
    const { bookings } = await asAdmin.json();
    expect(bookings.map((b: { bookingid: number }) => b.bookingid)).toContain(created.bookingid);
  });

  // ---------- Validaciones: particiones de equivalencia + valores límite ----------
  // Regla: firstname 3-18 caracteres. Probamos justo en los bordes (2,3,18,19).
  const firstnameCases = [
    { name: 'ab', len: 2, expected: 400 },
    { name: 'abc', len: 3, expected: 201 },
    { name: 'a'.repeat(18), len: 18, expected: 201 },
    { name: 'a'.repeat(19), len: 19, expected: 400 },
  ];
  for (const { name, len, expected } of firstnameCases) {
    test(`firstname con ${len} caracteres -> ${expected} @AC4`, async ({ api, createdBookings }) => {
      const res = await api.createBooking(buildBooking({ firstname: name }));
      expect(res.status()).toBe(expected);
      if (res.status() === 201) createdBookings.push((await res.json()).bookingid);
    });
  }

  // Regla: phone 11-21 caracteres
  for (const { phone, expected } of [
    { phone: '1234567890', expected: 400 }, // 10
    { phone: '12345678901', expected: 201 }, // 11
    { phone: '1'.repeat(21), expected: 201 }, // 21
    { phone: '1'.repeat(22), expected: 400 }, // 22
  ]) {
    test(`phone con ${phone.length} caracteres -> ${expected} @AC4`, async ({ api, createdBookings }) => {
      const res = await api.createBooking(buildBooking({ phone }));
      expect(res.status()).toBe(expected);
      if (res.status() === 201) createdBookings.push((await res.json()).bookingid);
    });
  }

  test('email inválido -> 400 con mensaje de error @AC4', async ({ api }) => {
    const res = await api.createBooking(buildBooking({ email: 'no-es-un-email' }));
    expect(res.status()).toBe(400);
    expect(JSON.stringify(await res.json())).toMatch(/email/i);
  });

  test('campos obligatorios vacíos -> 400 con todos los errores @AC4', async ({ api }) => {
    const res = await api.createBooking({ roomid: 1, bookingdates: futureStay() });
    expect(res.status()).toBe(400);
    const errors: string[] = (await res.json()).errors;
    expect(errors).toEqual(
      expect.arrayContaining(['Firstname should not be blank', 'Lastname should not be blank']),
    );
  });
});

/**
 * BUGS CONOCIDOS: test.fail() = "sé que este test falla por un bug ya reportado".
 * - El suite sigue en verde mientras el bug exista (no genera ruido).
 * - Si alguien arregla el bug, el test pasa y Playwright lo marca como fallo inesperado
 *   -> nos avisa de que hay que quitar la marca y cerrar el ticket.
 */
test.describe('API Booking - bugs conocidos @api @known-bug', () => {
  test('consultar una reserva por id con token devuelve 200 (H-01) @AC9', async ({ api, adminToken, createdBookings }) => {
    test.fail(true, 'H-01: GET /api/booking/{id} devuelve 500 en la demo pública');
    const created = await (await api.createBooking(buildBooking())).json();
    createdBookings.push(created.bookingid);

    const res = await api.getBooking(created.bookingid, adminToken);

    expect(res.status()).toBe(200);
  });

  test('borrar una reserva con token funciona (H-01) @AC9', async ({ api, adminToken }) => {
    test.fail(true, 'H-01: DELETE /api/booking/{id} devuelve 500 en la demo pública');
    const created = await (await api.createBooking(buildBooking())).json();

    const res = await api.deleteBooking(created.bookingid, adminToken);

    expect(res.ok()).toBeTruthy();
  });
});
