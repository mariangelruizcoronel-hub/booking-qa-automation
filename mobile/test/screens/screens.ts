import { $, $$ } from '@wdio/globals';

/**
 * Screen Objects (el Page Object del móvil).
 * Localizador preferido: accessibility id ("~...") -> funciona igual en Android e iOS.
 * Evitamos XPath: lento y frágil.
 */
const byA11y = (id: string) => $(`~${id}`);
const byText = (text: string) => $(`android=new UiSelector().text("${text}")`);

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
  review: () => byA11y('checkout review order screen'),
  complete: () => byA11y('checkout complete screen'),
  field: (label: string) => byA11y(`${label} input field`),

  async fillAddress(a: { fullName: string; line1: string; city: string; zip: string; country: string }) {
    await this.address().waitForDisplayed();
    await this.field('Full Name*').setValue(a.fullName);
    await this.field('Address Line 1*').setValue(a.line1);
    await this.field('City*').setValue(a.city);
    await this.field('Zip Code*').setValue(a.zip);
    await this.field('Country*').setValue(a.country);
    await byText('To Payment').click();
  },

  async fillPayment(p: { fullName: string; card: string; exp: string; cvv: string }) {
    await this.payment().waitForDisplayed();
    await this.field('Full Name*').setValue(p.fullName);
    await this.field('Card Number*').setValue(p.card);
    await this.field('Expiration Date*').setValue(p.exp);
    await this.field('Security Code*').setValue(p.cvv);
    await byText('Review Order').click();
  },

  async placeOrder() {
    await this.review().waitForDisplayed();
    await byText('Place Order').click();
  },
};
