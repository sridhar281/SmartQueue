from app.schemas.analytics import SimulationRequest
from app.services.simulation_service import run_simulation


def test_more_counters_lower_the_average_wait():
    result = run_simulation(SimulationRequest(counters=3, customers=60, avg_service_minutes=9))
    waits = {row.counters: row.avg_wait_minutes for row in result.scenarios}

    assert waits[1] > waits[3] > waits[5]


def test_throughput_scales_with_counters():
    result = run_simulation(SimulationRequest(counters=2, customers=30, avg_service_minutes=10))
    rows = {row.counters: row.throughput_per_hour for row in result.scenarios}

    assert rows[1] == 6.0  # 60 / 10
    assert rows[2] == 12.0
