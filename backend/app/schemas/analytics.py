from pydantic import BaseModel


class OverviewStats(BaseModel):
    tokens_today: int
    waiting_now: int
    serving_now: int
    completed_today: int
    cancelled_today: int
    avg_waiting_minutes: float
    avg_service_minutes: float
    active_counters: int
    peak_hour: str | None


class HourlyPoint(BaseModel):
    hour: str
    tokens: int
    avg_wait_minutes: float


class ServiceStat(BaseModel):
    service_id: int
    service_name: str
    completed: int
    avg_service_minutes: float
    avg_wait_minutes: float


class CounterStat(BaseModel):
    counter_id: int
    counter_name: str
    served: int
    busy_minutes: float
    utilisation_percent: float


class SimulationRequest(BaseModel):
    counters: int = 3
    customers: int = 60
    avg_service_minutes: float = 9.0
    max_counters: int = 8


class SimulationRow(BaseModel):
    counters: int
    avg_wait_minutes: float
    last_customer_wait_minutes: float
    throughput_per_hour: float


class SimulationResponse(BaseModel):
    baseline: SimulationRow
    scenarios: list[SimulationRow]
    note: str
