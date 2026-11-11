import { expect } from '@wdio/globals';
import { CatalogScreen, ProductScreen, CartScreen, LoginScreen, CheckoutScreen } from '../screens/screens';

/**
 * Flujo crítico en la app nativa: elegir producto -> login -> datos -> pago -> confirmación.
 * Paralelo con Heymondo: en la app, el cliente inicia sesión, ve su póliza y abre un siniestro/chat.
 * Datos de prueba: usuario y tarjeta FICTICIOS que ofrece la propia app de demo.
 */
describe('App móvil - compra de principio a fin', () => {
  it('un usuario logueado completa el checkout', async () => {
    await CatalogScreen.openFirstProduct();

    await ProductScreen.screen().waitForDisplayed();
    await ProductScreen.addToCart().click();
    await expect(ProductScreen.cartBadge()).toBeDisplayed();

    await ProductScreen.cartBadge().click();
    await CartScreen.screen().waitForDisplayed();
    await CartScreen.proceedToCheckout().click();

    await LoginScreen.login('bob@example.com', '10203040');

    await CheckoutScreen.fillAddress({
      fullName: 'Rebecca Winter',
      line1: 'Mandorley 112',
      city: 'Truro',
      zip: '89750',
      country: 'United Kingdom',
    });
    await CheckoutScreen.fillPayment({
      fullName: 'Rebecca Winter',
      card: '3258125675687891',
      exp: '0329',
      cvv: '123',
    });
    await CheckoutScreen.placeOrder();

    await expect(CheckoutScreen.complete()).toBeDisplayed();
  });
});

describe('App móvil - login', () => {
  it('un usuario bloqueado ve un mensaje de error', async () => {
    await CatalogScreen.openFirstProduct();
    await ProductScreen.addToCart().click();
    await ProductScreen.cartBadge().click();
    await CartScreen.proceedToCheckout().click();

    await LoginScreen.login('alice@example.com', '10203040');

    await expect(LoginScreen.error()).toHaveText(expect.stringContaining('locked out'));
  });
});
