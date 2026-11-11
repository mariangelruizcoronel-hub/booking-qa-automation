# Estrategia de pruebas

## Objetivo
Feedback rápido y fiable en cada cambio, con la automatización como estrategia principal. El testing manual queda para exploración y para lo que aún no está automatizado.

## Priorización por riesgo

| Prioridad | Área | Por qué | Cobertura |
| --- | --- | --- | --- |
| 1 | Crear reserva (API + UI) | Es el ingreso: si falla, no hay venta | API completa + E2E smoke |
| 2 | Cálculo de precio | Un error de precio es pérdida o reclamación | API contrato + E2E de regla de negocio |
| 3 | Validaciones de datos | Datos malos = reservas o pólizas inválidas | API con valores límite + Gherkin |
| 4 | Disponibilidad / buscador | Puerta de entrada del funnel | API + E2E |
| 5 | Contacto y backoffice | Atención al cliente | API + E2E |
| 6 | App móvil | Canal de asistencia | Appium (checkout + login) |

## Niveles
- **API** (la mayoría): reglas de negocio, validaciones, autorización, contrato, rendimiento básico.
- **UI E2E** (pocos): solo flujos críticos y reglas visibles para el usuario.
- **BDD**: escenarios acordados con producto, ejecutables.
- **Móvil**: web móvil emulada en cada nightly; app nativa con Appium.
- **Manual / exploratorio**: sesiones por charter sobre funcionalidad nueva antes de automatizarla.

## Técnicas de diseño usadas
- Particiones de equivalencia y valores límite (longitud de nombre y teléfono).
- Tablas de decisión (validaciones del formulario de contacto: una regla rota por fila).
- Testing basado en riesgo para priorizar.
- Pruebas negativas y de autorización (consultar reserva sin token → 403).

## Ejecución en CI
| Evento | Qué corre | Objetivo de tiempo |
| --- | --- | --- |
| Pull request | typecheck + API + smoke E2E | < 10 min, bloquea el merge |
| Push a main | regresión completa (API + E2E + BDD) con 2 shards | < 20 min |
| Nightly | Firefox + web móvil | Informativo |

## Métricas
- % de flujos críticos automatizados.
- Duración de la pipeline de PR.
- Tasa de tests flaky (objetivo < 2%).
- Bugs escapados a producción por release.

## Siguientes pasos
- Reporte Allure o envío de resultados a Slack.
- Tests de accesibilidad con `@axe-core/playwright` en las páginas clave.
- Tests de regresión visual en la página de precio.
- Appium en CI con un emulador (o una granja de dispositivos).
