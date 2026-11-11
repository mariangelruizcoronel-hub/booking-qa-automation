import { test, expect } from '../../src/fixtures/fixtures';
import { futureStay } from '../../src/data/factories';

/**
 * API de habitaciones = el equivalente al COTIZADOR (qué planes hay y a qué precio).
 * Incluye un "test de contrato" ligero: si el backend cambia la forma de la respuesta,
 * el frontend se rompería -> lo detectamos aquí antes que en la UI.
 */
test.describe('API Room @api', () => {
  test('listado de habitaciones cumple el contrato @smoke', async ({ api }) => {
    const res = await api.getRooms();
    expect(res.status()).toBe(200);

    const { rooms } = await res.json();
    expect(rooms.length).toBeGreaterThan(0);
    for (const room of rooms) {
      expect(room).toEqual(
        expect.objectContaining({
          roomid: expect.any(Number),
          roomName: expect.any(String),
          type: expect.any(String),
          accessible: expect.any(Boolean),
          roomPrice: expect.any(Number),
          features: expect.any(Array),
        }),
      );
      expect(room.roomPrice, `precio de la habitación ${room.roomName}`).toBeGreaterThan(0);
    }
  });

  test('buscar disponibilidad con fechas devuelve habitaciones', async ({ api }) => {
    const { checkin, checkout } = futureStay(3);
    const res = await api.getAvailableRooms(checkin, checkout);
    expect(res.status()).toBe(200);
    expect((await res.json()).rooms.length).toBeGreaterThan(0);
  });

  test('habitación inexistente -> 404', async ({ api }) => {
    const res = await api.getRoom(999999);
    expect(res.status()).toBe(404);
  });

  test('responde en menos de 1,5 s (presupuesto de rendimiento básico)', async ({ api }) => {
    const start = Date.now();
    await api.getRooms();
    expect(Date.now() - start).toBeLessThan(1500);
  });
});
