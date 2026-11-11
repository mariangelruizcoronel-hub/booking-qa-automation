# Guion de la demo en directo (8-10 minutos)

Antes de la entrevista: `npm ci`, `npx playwright install`, ejecuta `npm run demo:full` una vez para comprobar que todo va, y deja abiertos VS Code, la terminal y el navegador.

| # | Qué enseñas | Comando / fichero | Qué dices |
|---|---|---|---|
| 1 | La historia y sus ACs | `src/data/acceptance-criteria.ts` | "Todo parte del ticket: una historia con 9 criterios de aceptación. Cada test lleva la etiqueta del AC que cubre." |
| 2 | Gherkin | `features/booking.feature` | "Los ACs los escribo en Gherkin con el PO antes del desarrollo. Uso Scenario Outline para los valores límite, y este fichero se ejecuta tal cual." |
| 3 | Framework | `src/pages/ReservationPage.ts`, `src/fixtures/fixtures.ts` | "Page Objects con selectores por rol, y fixtures que inyectan páginas, cliente de API y token, y limpian al final." |
| 4 | API en vivo | `npm run test:api` | "25 tests en segundos. Aquí está la mayor parte de la cobertura: valores límite, 409, 401 y contrato." |
| 5 | UI en vivo, a cámara lenta | `npm run demo` | "El navegador visible: reserva de principio a fin, cálculo de precio y backend caído simulado con un mock." |
| 6 | Depurar un fallo | `npm run report` → abrir un test → Trace | "Si algo falla en CI, el trace me da DOM, red y consola paso a paso. No necesito reproducirlo en local." |
| 7 | Bug real encontrado | `docs/hallazgos.md` + test `@known-bug` | "Ejecutando la suite encontré que la página de reserva no carga, por un 500 en el detalle de habitación. Lo reporté, lo dejé controlado con `test.fail` y aislé el frontend con un stub." |
| 8 | Resumen de sprint | `npm run summary` | "Al terminar, Playwright genera este resumen: veredicto, pass rate, cobertura por AC y bugs abiertos. En CI va directo al resumen del job." |
| 9 | CI/CD | `.github/workflows/ci.yml` + pestaña Actions | "En la PR: typecheck, API y smoke, bloqueando el merge. En main: regresión con sharding. Cada noche: Firefox y móvil." |
| 10 | Móvil | `npm run demo:mobile` + carpeta `mobile/` | "Primero web móvil emulada; después la app nativa con Appium y WebdriverIO, con el mismo ecosistema TypeScript." |

**Alternativa visual:** `npm run demo:ui` abre el modo UI de Playwright. Ahí puedes lanzar cualquier test con un clic, ver la línea de tiempo y hacer "pick locator" en directo. Es lo más vistoso para compartir pantalla.

**Si la demo pública falla en directo:** no pasa nada. Enseña el trace y el resumen: "esto es exactamente lo que el sistema tiene que hacer, avisarte con evidencia".
