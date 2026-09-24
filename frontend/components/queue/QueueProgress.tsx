/**
 * Shows the customer's position as a row of dots: filled dots are people still
 * ahead, the ring is them. More legible on a phone than a percentage bar.
 */
export function QueueProgress({ peopleAhead, max = 8 }: { peopleAhead: number; max?: number }) {
  const shown = Math.min(peopleAhead, max);
  const overflow = peopleAhead - shown;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>Now serving</span>
        <span>You</span>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: shown }).map((_, i) => (
          <span key={i} className="h-2.5 flex-1 rounded-full bg-slate-200" />
        ))}
        {overflow > 0 && <span className="px-1 text-xs text-slate-400">+{overflow}</span>}
        <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-brand-600 ring-4 ring-brand-100" />
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {peopleAhead === 0
          ? "You're next in line."
          : `${peopleAhead} ${peopleAhead === 1 ? "person is" : "people are"} ahead of you.`}
      </p>
    </div>
  );
}
