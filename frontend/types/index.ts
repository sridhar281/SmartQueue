export type Role = "customer" | "admin";

export type TokenStatus = "WAITING" | "CALLED" | "SERVING" | "COMPLETED" | "SKIPPED" | "CANCELLED";
export type CounterStatus = "AVAILABLE" | "SERVING" | "OFFLINE";
export type AppointmentStatus = "SCHEDULED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "MISSED";

export interface User { id: number; name: string; email: string; role: Role; created_at: string; }

export interface Service {
  id: number; name: string; description: string; average_duration: number;
  active: boolean; created_at: string;
  waiting_count: number; estimated_wait_minutes: number; average_service_minutes: number;
}

export interface QueueToken {
  id: number; token_number: string; user_id: number; service_id: number;
  counter_id: number | null; priority: number; status: TokenStatus;
  created_at: string; called_at: string | null; started_at: string | null; completed_at: string | null;
  service_name: string; customer_name: string; counter_name: string | null;
  people_ahead: number; estimated_wait_minutes: number; now_serving: string | null;
}

export interface Counter {
  id: number; name: string; status: CounterStatus; created_at: string;
  current_token: string | null; current_customer: string | null; current_service: string | null;
}

export interface Appointment {
  id: number; user_id: number; service_id: number; service_name: string | null;
  appointment_date: string; appointment_time: string; status: AppointmentStatus; created_at: string;
}

export interface Overview {
  tokens_today: number; waiting_now: number; serving_now: number; completed_today: number;
  cancelled_today: number; avg_waiting_minutes: number; avg_service_minutes: number;
  active_counters: number; peak_hour: string | null;
}

export interface HourlyPoint { hour: string; tokens: number; avg_wait_minutes: number; }
export interface ServiceStat { service_id: number; service_name: string; completed: number; avg_service_minutes: number; avg_wait_minutes: number; }
export interface CounterStat { counter_id: number; counter_name: string; served: number; busy_minutes: number; utilisation_percent: number; }
export interface SimulationRow { counters: number; avg_wait_minutes: number; last_customer_wait_minutes: number; throughput_per_hour: number; }
export interface SimulationResult { baseline: SimulationRow; scenarios: SimulationRow[]; note: string; }

/** Every WebSocket message the backend sends has this shape. */
export interface QueueEvent {
  event: "connected" | "pong" | "token_created" | "token_called" | "token_serving"
    | "token_completed" | "token_skipped" | "token_cancelled" | "counter_updated";
  data: Record<string, unknown>;
}
