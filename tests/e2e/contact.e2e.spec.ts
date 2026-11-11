import { test, expect } from '../../src/fixtures/fixtures';
import { buildMessage } from '../../src/data/factories';

test.describe('Contacto E2E @e2e', () => {
  test('el usuario envía una consulta y ve la confirmación @smoke @mobile', async ({ homePage, page }) => {
    const msg = buildMessage();
    await homePage.goto();

    await homePage.sendContactMessage(msg);

    await expect(page.getByRole('heading', { name: `Thanks for getting in touch ${msg.name}!` })).toBeVisible();
    await expect(page.getByText(msg.subject)).toBeVisible();
  });

  test('muestra errores de validación si el mensaje es demasiado corto', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.sendContactMessage(buildMessage({ description: 'corto' }));

    await expect(page.locator('#contact .alert-danger')).toContainText('Message must be between 20 and 2000 characters.');
  });
});
