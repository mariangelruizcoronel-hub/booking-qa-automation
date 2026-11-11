import { faker } from '@faker-js/faker';

/**
 * Factoría de datos de test.
 * - Datos SINTÉTICOS (nunca reales): en un seguro de viaje hay datos de salud -> RGPD.
 * - Fechas aleatorias en el futuro lejano: cada test usa su propio rango para no chocar
 *   con otras reservas y poder ejecutar en paralelo.
 */

export interface BookingDates {
  checkin: string; // YYYY-MM-DD
  checkout: string;
}

export interface BookingPayload {
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  email: string;
  phone: string;
  bookingdates: BookingDates;
}

export interface MessagePayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
}

const toIso = (d: Date) => d.toISOString().slice(0, 10);

/** Rango de N noches empezando entre 1 y ~8 años en el futuro. */
export function futureStay(nights = 2): BookingDates {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + faker.number.int({ min: 365, max: 3000 }));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + nights);
  return { checkin: toIso(start), checkout: toIso(end) };
}

/** Nombre que cumple la regla de longitud (3-18) */
const validName = () => faker.person.firstName().padEnd(3, 'x').slice(0, 18);

export function buildBooking(overrides: Partial<BookingPayload> = {}): BookingPayload {
  return {
    roomid: 1,
    firstname: validName(),
    lastname: faker.person.lastName().padEnd(3, 'x').slice(0, 30),
    depositpaid: false,
    email: faker.internet.email().toLowerCase(),
    phone: faker.string.numeric(12), // regla: 11-21 caracteres
    bookingdates: futureStay(),
    ...overrides,
  };
}

export function buildMessage(overrides: Partial<MessagePayload> = {}): MessagePayload {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.string.numeric(12),
    subject: `Consulta ${faker.string.alphanumeric(6)}`, // 5-100
    description: faker.lorem.sentence({ min: 8, max: 14 }), // 20-2000
    ...overrides,
  };
}

/** Formato que muestra el datepicker de la home (locale en-US: MM/DD/YYYY) */
export function toPickerFormat(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}
