import { test as base, createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ReservationPage } from '../pages/ReservationPage';
import { AdminPage } from '../pages/AdminPage';
import { ApiClient } from '../api/ApiClient';

/**
 * Fixtures propias = inyección de dependencias.
 * Cada test pide lo que necesita ({ homePage, api, adminToken }) y Playwright
 * lo crea antes y lo limpia después. Las usan tanto los tests .spec.ts como los steps de Gherkin.
 */
type Fixtures = {
  homePage: HomePage;
  reservationPage: ReservationPage;
  adminPage: AdminPage;
  api: ApiClient;
  adminToken: string;
  /** Reservas creadas en el test: se borran automáticamente al terminar (teardown). */
  createdBookings: number[];
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => use(new HomePage(page)),
  reservationPage: async ({ page }, use) => use(new ReservationPage(page)),
  adminPage: async ({ page }, use) => use(new AdminPage(page)),
  api: async ({ request }, use) => use(new ApiClient(request)),

  adminToken: async ({ api }, use) => {
    await use(await api.getAdminToken());
  },

  createdBookings: async ({ api }, use) => {
    const ids: number[] = [];
    await use(ids);
    // Teardown: dejar el entorno limpio para no contaminar otros tests
    if (ids.length) {
      const token = await api.getAdminToken();
      for (const id of ids) await api.deleteBooking(id, token);
    }
  },
});

export { expect };
export const { Given, When, Then } = createBdd(test);
