import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { BookingPayload, MessagePayload } from '../data/factories';

/**
 * Cliente de API: encapsula los endpoints para que los tests hablen en lenguaje de negocio
 * ("crear reserva") y no de HTTP. Equivale al Page Object, pero para la API.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  // ---------- Auth ----------
  async login(username = process.env.ADMIN_USER ?? 'admin', password = process.env.ADMIN_PASSWORD ?? 'password') {
    const res = await this.request.post('/api/auth/login', { data: { username, password } });
    return res;
  }

  /** Devuelve el token de admin (la API lo espera como cookie "token"). */
  async getAdminToken(): Promise<string> {
    const res = await this.login();
    expect(res.status(), 'login de admin').toBe(200);
    const body = await res.json();
    return body.token as string;
  }

  // ---------- Rooms ----------
  async getRooms(): Promise<APIResponse> {
    return this.request.get('/api/room');
  }

  async getAvailableRooms(checkin: string, checkout: string): Promise<APIResponse> {
    return this.request.get('/api/room', { params: { checkin, checkout } });
  }

  async getRoom(id: number): Promise<APIResponse> {
    return this.request.get(`/api/room/${id}`);
  }

  /** Datos de una habitación sacados del listado (alternativa mientras GET /api/room/{id} falla, H-02) */
  async getRoomFromList(id: number): Promise<{ roomid: number; roomPrice: number; [k: string]: unknown }> {
    const res = await this.getRooms();
    expect(res.status()).toBe(200);
    const { rooms } = await res.json();
    const room = rooms.find((r: { roomid: number }) => r.roomid === id);
    expect(room, `la habitación ${id} existe en el listado`).toBeTruthy();
    return room;
  }

  // ---------- Bookings ----------
  async createBooking(payload: Partial<BookingPayload> | Record<string, unknown>): Promise<APIResponse> {
    return this.request.post('/api/booking', { data: payload });
  }

  /** Listado de reservas de una habitación (requiere token de admin) */
  async getBookings(roomid: number, token?: string): Promise<APIResponse> {
    return this.request.get('/api/booking', {
      params: { roomid },
      headers: token ? { Cookie: `token=${token}` } : {},
    });
  }

  async getBooking(id: number, token?: string): Promise<APIResponse> {
    return this.request.get(`/api/booking/${id}`, { headers: token ? { Cookie: `token=${token}` } : {} });
  }

  async deleteBooking(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(`/api/booking/${id}`, { headers: { Cookie: `token=${token}` } });
  }

  // ---------- Messages (formulario de contacto) ----------
  async sendMessage(payload: Partial<MessagePayload>): Promise<APIResponse> {
    return this.request.post('/api/message', { data: payload });
  }
}
