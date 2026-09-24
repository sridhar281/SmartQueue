/**
 * One thin wrapper around fetch.
 *
 * It does three things: prefix the API URL, attach the JWT, and turn the
 * backend's { success: false, message } error body into a thrown Error whose
 * message can be shown to the user directly.
 */
import type {
  Appointment, Counter, CounterStat, HourlyPoint, Overview, QueueToken,
  Service, ServiceStat, SimulationResult, User,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "smartqueue_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) { window.localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { window.localStorage.removeItem(TOKEN_KEY); }

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body.message ?? "Something went wrong. Please try again.", response.status);
  }
  return body as T;
}

const post = <T,>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) });
const patch = <T,>(path: string, data: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(data) });

export const api = {
  // auth
  register: (name: string, email: string, password: string) =>
    post<{ access_token: string; user: User }>("/api/auth/register", { name, email, password }),
  login: (email: string, password: string) =>
    post<{ access_token: string; user: User }>("/api/auth/login", { email, password }),
  me: () => request<User>("/api/auth/me"),

  // services
  services: (includeInactive = false) =>
    request<Service[]>(`/api/services?include_inactive=${includeInactive}`),
  createService: (data: { name: string; description: string; average_duration: number }) =>
    post<Service>("/api/services", data),
  updateService: (id: number, data: Partial<Service>) => patch<Service>(`/api/services/${id}`, data),
  deactivateService: (id: number) => request<Service>(`/api/services/${id}`, { method: "DELETE" }),

  // queue (customer)
  takeToken: (serviceId: number) => post<QueueToken>("/api/queue/tokens", { service_id: serviceId }),
  myToken: () => request<QueueToken | null>("/api/queue/my-token"),
  queueStatus: (serviceId?: number) =>
    request<QueueToken[]>(`/api/queue/status${serviceId ? `?service_id=${serviceId}` : ""}`),
  myHistory: (params: { status?: string; service_id?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v).map(([k, v]) => [k, String(v)]));
    return request<QueueToken[]>(`/api/queue/history${q.toString() ? `?${q}` : ""}`);
  },
  cancelToken: (id: number) => post<QueueToken>(`/api/queue/${id}/cancel`),

  // queue (admin)
  callNext: (counterId: number, serviceId?: number) =>
    post<QueueToken>("/api/admin/queue/next", { counter_id: counterId, service_id: serviceId ?? null }),
  startServing: (id: number) => post<QueueToken>(`/api/admin/queue/${id}/start`),
  completeService: (id: number) => post<QueueToken>(`/api/admin/queue/${id}/complete`),
  skipToken: (id: number, reason?: string) => post<QueueToken>(`/api/admin/queue/${id}/skip`, { reason }),

  // counters
  counters: () => request<Counter[]>("/api/admin/counters"),
  createCounter: (name: string) => post<Counter>("/api/admin/counters", { name, status: "OFFLINE" }),
  updateCounter: (id: number, data: { status?: string; name?: string }) =>
    patch<Counter>(`/api/admin/counters/${id}`, data),

  // appointments
  appointments: () => request<Appointment[]>("/api/appointments"),
  bookAppointment: (data: { service_id: number; appointment_date: string; appointment_time: string }) =>
    post<Appointment>("/api/appointments", data),
  updateAppointment: (id: number, data: { status?: string }) =>
    patch<Appointment>(`/api/appointments/${id}`, data),
  checkIn: (id: number) => post<QueueToken>(`/api/appointments/${id}/check-in`),

  // analytics
  overview: () => request<Overview>("/api/admin/analytics/overview"),
  hourly: () => request<HourlyPoint[]>("/api/admin/analytics/hourly"),
  serviceStats: () => request<ServiceStat[]>("/api/admin/analytics/services"),
  counterStats: () => request<CounterStat[]>("/api/admin/analytics/counters"),
  simulate: (data: { counters: number; customers: number; avg_service_minutes: number }) =>
    post<SimulationResult>("/api/admin/analytics/simulate", data),
};
