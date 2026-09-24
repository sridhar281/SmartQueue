"""A simplified queue simulation for the admin "what if" page.

It is a deterministic arithmetic model, NOT a real-world prediction. It answers
one question: if customers arrive steadily and every service takes about the
same time, roughly how long would people wait with N counters instead of 3?

Model
-----
With C counters each taking T minutes per customer, the counters together
finish one customer every T/C minutes. Customer number i (0-indexed) is served
after floor(i / C) rounds, so:

    wait(i) = floor(i / C) x T
    average wait = mean of wait(i) for all customers
    throughput   = 60 / T x C customers per hour

Real queues are messier - arrivals are bursty, some customers take much longer,
staff take breaks - so the numbers are a planning aid, not a promise.
"""

from app.schemas.analytics import SimulationRequest, SimulationResponse, SimulationRow


def _simulate(counters: int, customers: int, avg_service_minutes: float) -> SimulationRow:
    counters = max(counters, 1)
    waits = [(i // counters) * avg_service_minutes for i in range(max(customers, 1))]
    return SimulationRow(
        counters=counters,
        avg_wait_minutes=round(sum(waits) / len(waits), 1),
        last_customer_wait_minutes=round(waits[-1], 1),
        throughput_per_hour=round((60 / avg_service_minutes) * counters, 1),
    )


def run_simulation(request: SimulationRequest) -> SimulationResponse:
    baseline = _simulate(request.counters, request.customers, request.avg_service_minutes)
    scenarios = [
        _simulate(c, request.customers, request.avg_service_minutes)
        for c in range(1, max(request.max_counters, request.counters + 1) + 1)
    ]
    return SimulationResponse(
        baseline=baseline,
        scenarios=scenarios,
        note=(
            "Simplified model: it assumes steady arrivals and equal service times. "
            "Use it to compare options, not to predict exact waiting times."
        ),
    )
