import { $, $$, driver } from '@wdio/globals';
import type { ChainablePromiseElement } from 'webdriverio';

/**
 * Screen Objects (el Page Object del móvil).
 * Localizador preferido: accessibility id ("~...") -> funciona igual en Android e iOS.
 * Evitamos XPath: lento y frágil.
 */
const byA11y = (id: string) => $(`~${id}`);
const byText = (text: string) => $(`android=new UiSelector().text("${text}")`);

/** Cierra el teclado si está abierto: en Android tapa los botones de abajo y el tap no llega. */
async function hideKeyboard() {
  if (await driver.isKeyboardShown()) {
    await driver.hideKeyboard();
    await driver.pause(500); // esperar a que termine la animación del teclado
  }
}

/** Botón por accessibility id y, si no existe, por su texto visible. */
async function tapButton(label: string) {
  await hideKeyboard();
  const byId = byA11y(`${label} button`);
  const target = (await byId.isExisting()) ? byId : byText(label);
  await target.click();
}

/**
 * Pulsa un botón hasta que aparezca la pantalla siguiente (máx. 3 intentos).
 * En React Native el primer tap a veces se pierde mientras el teclado se cierra.
 */
async function tapUntil(label: string, next: () => ChainablePromiseElement) {
  for (let intento = 1; intento <= 3; intento++) {
    await tapButton(label);
    await driver.pause(800);
    if (await next().waitForDisplayed({ timeout: 5000 }).then(() => true).catch(() => false)) return;
  }
  await next().waitForDisplayed(); // último intento: error claro si no aparece
}

export const CatalogScreen = {
  screen: () => byA11y('products screen'),
  firstProduct: () => $$('~store item')[0],
  async openFirstProduct() {
    await this.screen().waitForDisplayed();
    await (await this.firstProduct()).click();
  },
};

export const ProductScreen = {
  screen: () => byA11y('product screen'),
  price: () => byA11y('product price'),
  addToCart: () => byA11y('Add To Cart button'),
  cartBadge: () => byA11y('cart badge'),
};

export const CartScreen = {
  screen: () => byA11y('cart screen'),
  proceedToCheckout: () => byText('Proceed To Checkout'),
  totalPrice: () => byA11y('total price'),
};

export const LoginScreen = {
  screen: () => byA11y('login screen'),
  username: () => byA11y('Username input field'),
  password: () => byA11y('Password input field'),
  loginButton: () => byA11y('Login button'),
  error: () => byA11y('generic-error-message'),
  // El texto está en un hijo del contenedor de error, por eso lo buscamos por contenido
  errorText: (texto: string) => $(`android=new UiSelector().textContains("${texto}")`),
  async login(user: string, pass: string) {
    await this.screen().waitForDisplayed();
    await this.username().setValue(user);
    await this.password().setValue(pass);
    await this.loginButton().click();
  },
};

export const CheckoutScreen = {
  address: () => byA11y('checkout address screen'),
  payment: () => byA11y('checkout payment screen'),
  // Pantalla por accessibility id o, como respaldo, por un texto que solo aparece en ella
  review: () => $('//*[@content-desc="checkout review order screen" or @text="Place Order"]'),
  complete: () => $('//*[@content-desc="checkout complete screen" or @text="Checkout Complete"]'),
  field: (label: string) => byA11y(`${label} input field`),

  async fillAddress(a: { fullName: string; line1: string; city: string; zip: string; country: string }) {
    await this.address().waitForDisplayed();
    await this.field('Full Name*').setValue(a.fullName);
    await this.field('Address Line 1*').setValue(a.line1);
    await this.field('City*').setValue(a.city);
    await this.field('Zip Code*').setValue(a.zip);
    await this.field('Country*').setValue(a.country);
    await tapUntil('To Payment', () => this.payment());
  },

  async fillPayment(p: { fullName: string; card: string; exp: string; cvv: string }) {
    await this.payment().waitForDisplayed();
    await this.field('Full Name*').setValue(p.fullName);
    await this.field('Card Number*').setValue(p.card);
    await this.field('Expiration Date*').setValue(p.exp);
    await this.field('Security Code*').setValue(p.cvv);
    await tapUntil('Review Order', () => this.review());
  },

  async placeOrder() {
    await this.review().waitForDisplayed();
    await tapUntil('Place Order', () => this.complete());
  },
};
