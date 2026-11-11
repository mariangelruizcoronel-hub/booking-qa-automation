# Hallazgos

Defectos encontrados al ejecutar la suite contra la demo pública (https://automationintesting.online), verificados el 11/11/2026.
Formato de reporte: título, pasos, resultado esperado frente a obtenido, impacto y severidad. Cada bug tiene un test marcado con `test.fail()` y la etiqueta `@known-bug`. Si el bug se arregla, el test pasa y Playwright avisa de que hay que quitar la marca.

## H-02 · La página de reserva no carga: el usuario no puede reservar (CRÍTICO)

- **Pasos:** en la home, pulsar "Book now" en cualquier habitación (o abrir `/reservation/1?checkin=2034-05-01&checkout=2034-05-03`).
- **Esperado:** se muestra la habitación con el calendario, el resumen de precio y el botón "Reserve Now".
- **Obtenido:** la página se queda con el icono de carga indefinidamente. `GET /api/room/{id}` devuelve **500 Internal Server Error** para todas las habitaciones (1, 2, 3) y el frontend falla al leer la respuesta (`SyntaxError: Unexpected token 'I', "Internal S"... is not valid JSON`).
- **Variante:** una habitación inexistente (`/api/room/999999`) también devuelve 500 en vez de 404.
- **Impacto:** bloquea el 100% de las reservas desde la web, es decir, el flujo de ingresos. En Heymondo equivaldría a que el cotizador no cargue los planes.
- **Severidad / prioridad:** crítica / máxima.
- **Mejora adicional:** el frontend no gestiona el error. Debería mostrar un mensaje en vez de cargar para siempre.
- **Cómo lo gestiona la suite:** los tests E2E de reserva aíslan el frontend con un *stub* de ese endpoint (datos reales del listado `/api/room`). La creación de la reserva (POST) sigue siendo real. Así se sigue validando el resto del flujo mientras se arregla el bug.

## H-01 · Consultar o borrar una reserva por id devuelve 500 (ALTA)

- **Pasos:** login de admin, crear una reserva (201) y luego `GET /api/booking/{id}` o `DELETE /api/booking/{id}` con el token.
- **Esperado:** 200 con la reserva / la reserva se borra.
- **Obtenido:** 500 en ambos casos. El listado `GET /api/booking?roomid=1` sí funciona (200).
- **Patrón común con H-02:** fallan todos los endpoints con un id en la ruta (`/api/room/{id}`, `/api/booking/{id}`, `/api/report/room/{id}`). Probable causa en el proxy o en el enrutado, más que en cada servicio.
- **Impacto:** el backoffice no puede ver el detalle ni cancelar reservas. Además, los tests no pueden limpiar sus datos (por eso la limpieza es "best effort" y se anota en el reporte).

## Observación · El entorno desplegado no coincide con el código de GitHub

El repositorio devuelve los errores de validación en `fieldErrors` y la reserva creada dentro de un objeto `booking`. La demo desplegada devuelve `errors` y la reserva en el primer nivel. Los tests se ajustaron al comportamiento real del entorno.

Lección: no hay que fiarse solo de la documentación o del código. Hay que validar contra el entorno real y usar tests de contrato para detectar estas diferencias.
