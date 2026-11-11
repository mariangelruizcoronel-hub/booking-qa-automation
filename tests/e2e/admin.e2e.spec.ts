import { test, expect } from '../../src/fixtures/fixtures';
import { buildMessage } from '../../src/data/factories';
import { ADMIN_STATE } from '../../src/fixtures/paths';

/**
 * Backoffice. Patrón clave: crear los datos por API (rápido) y verificar en la UI solo lo visual.
 */
test.describe('Backoffice @e2e', () => {
  // Reutilizamos la sesión guardada por el proyecto "setup": cero logins repetidos
  test.use({ storageState: ADMIN_STATE });

  test('un mensaje enviado por un cliente aparece en la bandeja del admin @AC8', async ({ api, adminPage }) => {
    const msg = buildMessage();
    expect((await api.sendMessage(msg)).status()).toBe(200); // preparar estado por API

    await adminPage.openMessages();

    await expect(adminPage.messageRowWithSubject(msg.subject)).toBeVisible();
  });
});

test.describe('Login de admin @e2e', () => {
  test('credenciales incorrectas no dan acceso @AC9', async ({ adminPage, page }) => {
    await adminPage.login('admin', 'contraseña-incorrecta');
    await expect(page).not.toHaveURL(/\/admin\/rooms/);
    await expect(adminPage.loginButton).toBeVisible();
  });
});
