Feature: Reservar una habitación
  Como viajero
  Quiero reservar una habitación online
  Para tener mi estancia confirmada antes de viajar

  # Criterios de aceptación acordados con producto ("tres amigos": PO + dev + QA)
  # Lenguaje de negocio, no de UI: "confirmo la reserva", no "hago clic en el botón azul".

  Background:
    Given hay una habitación disponible para 2 noches

  @smoke @AC3
  Scenario: Reserva confirmada con datos válidos
    When introduzco mis datos de huésped válidos
    And confirmo la reserva
    Then veo que la reserva está confirmada

  @AC6
  Scenario: El precio total incluye las tasas
    Then el total es el precio por noche por 2 noches más 40 de tasas

  @AC4
  Scenario Outline: Validación de la longitud del nombre
    When introduzco el nombre "<nombre>" y el resto de datos válidos
    And confirmo la reserva
    Then el resultado de la reserva es "<resultado>"

    Examples:
      # Regla: nombre entre 3 y 18 caracteres -> valores límite 2, 3, 18 y 19
      | nombre              | resultado  |
      | Al                  | rechazada  |
      | Ana                 | confirmada |
      | Maximilianoandresx  | confirmada |
      | Maximilianoandresxy | rechazada  |
