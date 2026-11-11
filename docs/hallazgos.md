# Hallazgos

Registro de posibles defectos encontrados al analizar la aplicación. Formato de reporte: título, pasos, resultado esperado frente a obtenido, severidad y evidencia.

## H-01 · Los errores de validación de la reserva podrían no mostrarse en la UI

- **Origen:** revisión del código (análisis estático), pendiente de confirmar en la ejecución.
- **Detalle:** al crear una reserva inválida, el backend responde 400 con los errores en el campo `fieldErrors`. El formulario de reserva del frontend lee `errorData.errors`, un campo que no existe en esa respuesta.
- **Pasos para reproducir:**
  1. Abrir `/reservation/1?checkin=<fecha>&checkout=<fecha>`.
  2. Pulsar "Reserve Now" y escribir un nombre de 2 caracteres.
  3. Pulsar "Reserve Now" de nuevo.
- **Esperado:** alerta con el mensaje de validación del nombre.
- **Posible resultado:** no se muestra ningún mensaje, o la página falla al pintar los errores.
- **Severidad:** media. El usuario no sabe por qué no puede reservar, así que abandona la compra.
- **Cobertura:** `tests/e2e/booking.e2e.spec.ts` › "no confirma la reserva si faltan datos obligatorios" verifica el 400 y que no hay confirmación falsa. Una vez confirmado el comportamiento, añadir la aserción sobre el mensaje visible.

> Nota: restful-booker-platform es una aplicación de entrenamiento que incluye defectos a propósito.
