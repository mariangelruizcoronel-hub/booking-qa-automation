import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL ?? 'https://automationintesting.online';

// BDD: los .feature (Gherkin) se convierten en tests de Playwright con `npx bddgen`
const bddTestDir = defineBddConfig({
  features: 'features/*.feature',
  steps: ['features/steps/*.ts', 'src/fixtures/fixtures.ts'],
  outputDir: '.features-gen',
});

export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Los retries sirven para DETECTAR flaky tests (aparecen como "flaky" en el reporte), no para esconderlos
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['junit', { outputFile: 'results/junit.xml' }], ['github']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },
  projects: [
    // 1) Login de admin una sola vez -> guarda la sesión (storageState)
    { name: 'setup', testDir: 'tests/setup', testMatch: /.*\.setup\.ts/ },

    // 2) Tests de API: rápidos, sin navegador. Van en cada PR.
    { name: 'api', testDir: 'tests/api' },

    // 3) E2E de UI en escritorio
    {
      name: 'e2e-chromium',
      testDir: 'tests/e2e',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'e2e-firefox',
      testDir: 'tests/e2e',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
      grep: /@smoke/,
    },

    // 4) Web móvil emulada (paso previo a la automatización de la app nativa con Appium)
    {
      name: 'mobile-web',
      testDir: 'tests/e2e',
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
      grep: /@mobile/,
    },

    // 5) Escenarios Gherkin ejecutables
    {
      name: 'bdd',
      testDir: bddTestDir,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
