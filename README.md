# Booking QA Automation — Playwright + TypeScript + Gherkin + CI + Appium

Proyecto de automatización de pruebas sobre una **plataforma pública de reservas** ([restful-booker-platform](https://github.com/mwinteringham/restful-booker-platform), demo en <https://automationintesting.online>) y una **app móvil Android** de demo ([Sauce Labs My Demo App](https://github.com/saucelabs/my-demo-app-rn)).

Elegí este producto porque su flujo es el mismo que el de un e-commerce de seguros de viaje: **buscar → elegir → datos del cliente → confirmar**. Además tiene API REST, backoffice con login y app móvil.

| Necesidad del puesto | Dónde está en este repo |
| --- | --- |
| Casos de prueba en **Gherkin** a partir de criterios de aceptación | `features/booking.feature` + `features/steps/` (ejecutables con playwright-bdd) |
| Tests **UI** con Playwright + TypeScript | `tests/e2e/` + Page Objects en `src/pages/` |
| Tests **API** | `tests/api/` + cliente de API en `src/api/ApiClient.ts` |
| Diseño de casos: particiones, **valores límite**, tablas de decisión | `tests/api/booking.api.spec.ts`, `tests/api/message.api.spec.ts`, Scenario Outline |
| **Mocks** de servicios externos | `page.route()` en `tests/e2e/booking.e2e.spec.ts` |
| Login reutilizable, fixtures, datos de test | `tests/setup/auth.setup.ts` (storageState), `src/fixtures/`, `src/data/factories.ts` |
| **CI/CD** con GitHub Actions | `.github/workflows/ci.yml` (PR / regresión con sharding / nightly) |
| **Móvil**: web móvil emulada + app nativa con **Appium** | proyecto `mobile-web` + carpeta `mobile/` (WebdriverIO + UiAutomator2) |
| Estrategia y hallazgos | `docs/estrategia.md`, `docs/hallazgos.md` |

## Estructura

```
├── .github/workflows/ci.yml     # Pipeline: PR, regresión, nightly
├── features/                    # Gherkin (documentación viva + tests)
│   ├── booking.feature
│   └── steps/booking.steps.ts
├── src/
│   ├── api/ApiClient.ts         # Endpoints en lenguaje de negocio
│   ├── data/factories.ts        # Datos sintéticos (faker) y fechas únicas
│   ├── fixtures/fixtures.ts     # Inyección de Page Objects, API, token, teardown
│   └── pages/                   # Page Object Model
├── tests/
│   ├── setup/auth.setup.ts      # Login 1 vez -> storageState
│   ├── api/                     # Booking, Room (contrato), Message
│   └── e2e/                     # Reserva, contacto, backoffice
├── mobile/                      # Appium + WebdriverIO (Android)
└── playwright.config.ts         # Proyectos: setup, api, e2e, firefox, mobile-web, bdd
```

## Cómo ejecutarlo

Requisitos: Node 20+.

```bash
npm ci
npx playwright install --with-deps
cp .env.example .env            # BASE_URL por defecto: la demo pública

npm run test:api                # API (segundos)
npm run test:smoke              # Flujos críticos
npm run test:e2e                # UI completa en Chrome
npm run test:mobile-web         # Web móvil emulada (Pixel 7)
npm run test:bdd                # Escenarios Gherkin
npm test                        # Todo
npm run report                  # Abrir el reporte HTML (con trace viewer)
```

> La demo pública se reinicia periódicamente y la comparte mucha gente. Si hay inestabilidad, se puede levantar en local (ver el repo de restful-booker-platform) y apuntar `BASE_URL=http://localhost:3003`.

### Móvil (Appium)

```bash
cd mobile
npm ci
npm run appium:install-driver
# 1. Arranca un emulador Android (Android Studio > Device Manager)
# 2. Descarga el .apk de https://github.com/saucelabs/my-demo-app-rn/releases (v1.3.0)
#    y guárdalo como mobile/apps/my-demo-app-rn.apk (o usa APP_PATH=/ruta/al.apk)
npm test
```

## Decisiones de diseño (lo que contaría en una entrevista)

1. **Pirámide de tests.** 22 tests de API frente a 9 de UI. La API cubre reglas de negocio y combinaciones (milisegundos, estable). La UI solo cubre los flujos críticos.
2. **Preparar el estado por API, verificar en la UI.** El test de backoffice crea el mensaje por API y solo comprueba en pantalla que aparece. La reserva entra con las fechas en la URL en vez de pelear con el calendario.
3. **Selectores robustos.** `getByRole`, `getByPlaceholder`, `data-testid` y accessibility id en móvil. Sin XPath ni clases CSS.
4. **Tests independientes y paralelizables.** Cada test genera sus propios datos (faker + fechas aleatorias en el futuro). La fixture `createdBookings` borra lo creado en el teardown.
5. **Valores límite explícitos.** Nombre 3-18 → se prueba 2, 3, 18 y 19. Teléfono 11-21 → 10, 11, 21 y 22.
6. **Contrato de API.** `room.api.spec.ts` valida la forma de la respuesta: si el backend cambia un campo, se detecta antes de que rompa el frontend.
7. **Mocks.** `page.route()` simula un 500 del backend para comprobar que nunca se muestra una confirmación falsa. Es el equivalente a simular la pasarela de pago caída.
8. **Login una sola vez.** El proyecto `setup` guarda la sesión de admin y los tests de backoffice la reutilizan.
9. **Anti-flaky.** `retries: 1` solo en CI para *detectar* tests inestables (salen marcados como "flaky"), con trace, vídeo y captura en el primer fallo.
10. **CI por capas.** En la PR: typecheck + API + smoke (bloquea el merge). En main: regresión completa con sharding y reporte unificado. Nightly: Firefox + móvil.

## Cómo aplicaría esto a un producto de seguros de viaje

| En este repo | En un seguro de viaje |
| --- | --- |
| Buscar disponibilidad por fechas | Cotizar por destino, fechas, edades y viajeros |
| Habitaciones con precio | Planes con precio y coberturas |
| Resumen de precio (noches + tasas) | Precio final con coberturas opcionales y descuentos |
| Reserva confirmada | Pago y emisión de la póliza + email con el certificado |
| Formulario de contacto | Abrir consulta o siniestro |
| Backoffice | Gestión interna de pólizas y siniestros |
| App: login, carrito, checkout | App: login, ver póliza, chat médico, siniestro |
