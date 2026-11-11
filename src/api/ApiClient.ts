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

  // ---------- Bookings ----------
  async createBooking(payload: Partial<BookingPayload> | Record<string, unknown>): Promise<APIResponse> {
    return this.request.post('/api/booking', { data: payload });
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
