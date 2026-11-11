/**
 * Historia de usuario y criterios de aceptación (ACs).
 * Cada test se etiqueta con el AC que cubre (@AC1, @AC2...) -> el reporter calcula la
 * trazabilidad AC -> tests -> resultado de forma automática.
 */
export const STORY = {
  id: 'BK-1',
  title: 'Reservar una habitación online',
  asA: 'viajero',
  iWant: 'buscar, elegir y reservar una habitación',
  soThat: 'tener mi estancia confirmada antes de viajar',
};

export const ACCEPTANCE_CRITERIA: Record<string, string> = {
  AC1: 'Puedo buscar disponibilidad por fechas',
  AC2: 'Veo las habitaciones con su precio (contrato de API estable)',
  AC3: 'Reservo con datos válidos y veo la confirmación',
  AC4: 'Los datos inválidos se rechazan (nombre 3-18, teléfono 11-21, email)',
  AC5: 'No se pueden reservar fechas ya ocupadas',
  AC6: 'El total = precio por noche x noches + 40 de tasas',
  AC7: 'Si el sistema falla, nunca se muestra una confirmación falsa',
  AC8: 'Mis consultas de contacto llegan al backoffice',
  AC9: 'Solo un admin autenticado ve y gestiona las reservas',
};
