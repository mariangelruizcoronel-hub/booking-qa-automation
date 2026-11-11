import path from 'node:path';

/**
 * Appium + WebdriverIO para Android.
 * - Appium es un servidor que habla WebDriver y usa drivers nativos: UiAutomator2 (Android) / XCUITest (iOS).
 * - WebdriverIO es el cliente en TypeScript (mismo ecosistema JS/TS que Playwright).
 * - Para escalar: cambiar "services" por una granja de dispositivos (BrowserStack / Sauce Labs).
 */
const APP_PATH = process.env.APP_PATH ?? path.join(__dirname, 'apps', 'my-demo-app-rn.apk');

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./test/specs/**/*.ts'],
  maxInstances: 1,
  port: 4723,
  services: [['appium', { command: 'appium', args: { relaxedSecurity: true } }]],
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.DEVICE_NAME ?? 'Android Emulator',
      'appium:app': APP_PATH,
      'appium:appWaitActivity': '*',
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
    },
  ],
  logLevel: 'warn',
  waitforTimeout: 15_000,
  connectionRetryCount: 2,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: { ui: 'bdd', timeout: 120_000 },

  // Evidencia en caso de fallo: captura de pantalla
  afterTest: async function (test, _context, { passed }) {
    if (!passed) {
      await browser.saveScreenshot(`./errorShots/${test.title.replace(/\s+/g, '_')}.png`);
    }
  },
};
