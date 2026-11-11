import { test as setup } from '@playwright/test';
import { AdminPage } from '../../src/pages/AdminPage';

import { ADMIN_STATE } from '../../src/fixtures/paths';

/**
 * Login de admin UNA sola vez y guardado de la sesión (cookies) en .auth/admin.json.
 * Los tests de backoffice la reutilizan con test.use({ storageState: ADMIN_STATE })
 * -> no repetimos el login en cada test: ahorro de tiempo y menos flakiness.
 */
setup('autenticar admin', async ({ page }) => {
  const admin = new AdminPage(page);
  await admin.login(process.env.ADMIN_USER ?? 'admin', process.env.ADMIN_PASSWORD ?? 'password');
  await admin.expectLoggedIn();
  await page.context().storageState({ path: ADMIN_STATE });
});
