import Link from "next/link";
import {
  Activity, BarChart3, Bell, CalendarCheck, Clock, Gauge, LayoutGrid,
  MonitorCog, ShieldCheck, Ticket, Users,
} from "lucide-react";

/** Landing page. Static: no auth, no data fetching. */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <Hero />
      <Problem />
      <HowItWorks />
      <CustomerFeatures />
      <AdminFeatures />
      <RealTime />
      <Prediction />
      <Analytics />
      <UseCases />
      <CallToAction />
      <Footer />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">SQ</span>
          <span className="font-semibold tracking-tight text-slate-900">SmartQueue</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          <a href="#how" className="hover:text-slate-900">How it works</a>
          <a href="#realtime" className="hover:text-slate-900">Real time</a>
          <a href="#analytics" className="hover:text-slate-900">Analytics</a>
          <a href="#use-cases" className="hover:text-slate-900">Use cases</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign in</Link>
          <Link href="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * The hero shows the actual product surface - a live token - rather than a
 * stock illustration. It is the one thing a visitor needs to understand.
 */
function Hero() {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live queue updates
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Skip the uncertainty.<br />Know your place in line.
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-slate-600">
            A real-time digital queue and appointment management platform that helps organisations
            reduce waiting uncertainty and manage service counters efficiently.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700">
              Get started
            </Link>
            <Link href="/login"
              className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              View demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Demo accounts are listed in the README — sign in as a customer and an admin side by side.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-slate-50 px-6 py-8 text-center">
            <p className="text-xs font-medium text-slate-500">Document Verification</p>
            <p className="mt-2 font-mono text-5xl font-bold tracking-tight text-slate-900">SQ-104</p>
            <span className="mt-4 inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              waiting
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100">
            {[["People ahead", "5"], ["Estimated wait", "38 min"], ["Now serving", "SQ-099"]].map(([l, v]) => (
              <div key={l} className="px-2 py-4 text-center">
                <p className="text-[11px] text-slate-500">{l}</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className="h-2.5 flex-1 rounded-full bg-slate-200" />)}
            <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-brand-600 ring-4 ring-brand-100" />
          </div>
          <p className="mt-3 text-sm text-slate-600">5 people are ahead of you.</p>
        </div>
      </div>
    </section>
  );
}

function Section({ id, title, lead, children }: {
  id?: string; title: string; lead?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {lead && <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-slate-600">{lead}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Problem() {
  const points = [
    ["You can't leave", "Stand still for an hour because stepping out means losing your place."],
    ["Nobody knows how long", "Staff can only guess, so everyone plans for the worst case."],
    ["Counters sit idle", "One desk has a queue while another has nobody, and no one can see it."],
  ];
  return (
    <Section title="Waiting in line wastes everyone's time"
      lead="Banks, government offices, colleges and service centres all run the same broken loop: people arrive, take a paper slip, and then wait without information.">
      <div className="grid gap-5 sm:grid-cols-3">
        {points.map(([title, body]) => (
          <div key={title} className="rounded-xl border border-slate-200 p-5">
            <p className="font-medium text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** This one genuinely is a sequence, so it is numbered. */
function HowItWorks() {
  const steps = [
    ["Pick a service", "Choose what you came for and see how busy it is right now."],
    ["Take a token", "You get a number like SQ-104 and a position in line."],
    ["Watch it move", "Your position and estimated wait update as counters finish."],
    ["Walk up when called", "You're told which counter to go to the moment you're called."],
  ];
  return (
    <Section id="how" title="How SmartQueue works">
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([title, body], i) => (
          <li key={title} className="rounded-xl border border-slate-200 p-5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
              {i + 1}
            </span>
            <p className="mt-3 font-medium text-slate-900">{title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function FeatureGrid({ items }: { items: [typeof Ticket, string, string][] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([Icon, title, body]) => (
        <div key={title} className="rounded-xl border border-slate-200 p-5">
          <Icon className="h-5 w-5 text-brand-600" />
          <p className="mt-3 font-medium text-slate-900">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
        </div>
      ))}
    </div>
  );
}

function CustomerFeatures() {
  return (
    <Section title="For the person waiting">
      <FeatureGrid items={[
        [Ticket, "Digital tokens", "Take a numbered token from your phone instead of a paper slip."],
        [Clock, "Honest estimates", "See a wait time based on how fast counters are actually moving today."],
        [CalendarCheck, "Appointments", "Book a slot in advance and check in when you arrive."],
        [Bell, "Turn alerts", "Get told when you're next and which counter to go to."],
        [Activity, "Live position", "Your place in line updates by itself, with no refreshing."],
        [LayoutGrid, "Full history", "Every past visit, what it was for, and how long it took."],
      ]} />
    </Section>
  );
}

function AdminFeatures() {
  return (
    <Section title="For the people running the counters">
      <FeatureGrid items={[
        [MonitorCog, "Counter control", "Open and close counters, call the next customer, complete a service."],
        [Users, "One live queue", "Everyone waiting, in the exact order they will be called."],
        [BarChart3, "Daily analytics", "Tokens per hour, average wait, service mix and peak times."],
        [Gauge, "Counter utilisation", "See which desks are carrying the load and which are idle."],
        [ShieldCheck, "Role-based access", "Admin actions are enforced on the server, not just hidden in the UI."],
        [Activity, "Capacity planning", "Model what a fourth counter would do to the queue before opening one."],
      ]} />
    </Section>
  );
}

function RealTime() {
  return (
    <Section id="realtime" title="Updates arrive, not requested"
      lead="A WebSocket connection pushes every change the moment it happens. When a counter completes a service, everyone behind that customer sees their position and estimate move at once.">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="font-medium text-slate-900">What customers are told</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Someone ahead of you finished</li>
            <li>A counter opened or closed</li>
            <li>Your token was called</li>
            <li>Your estimated wait changed</li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="font-medium text-slate-900">What admins are told</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>A new token joined the queue</li>
            <li>A customer was called or skipped</li>
            <li>A service was completed</li>
            <li>A counter changed status</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

function Prediction() {
  return (
    <Section title="Waiting time you can check yourself"
      lead="No model you have to trust blindly. The estimate is arithmetic on real measurements, and the app shows you the sum.">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <p className="font-mono text-sm text-slate-600">
          last 5 Document Verification services: 8, 10, 7, 9, 11 min → average 9 min
        </p>
        <p className="mt-2 font-mono text-sm text-slate-600">
          4 people ahead × 9 min ÷ 1 open counter = <span className="font-semibold text-slate-900">36 min</span>
        </p>
        <p className="mt-2 font-mono text-sm text-slate-600">
          open a second counter → 4 × 9 ÷ 2 = <span className="font-semibold text-slate-900">18 min</span>
        </p>
      </div>
    </Section>
  );
}

function Analytics() {
  return (
    <Section id="analytics" title="Numbers that change how you staff the day"
      lead="Every completed service is recorded, so the dashboard can answer real operational questions.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Tokens today", "148"], ["Average wait", "18.4 min"], ["Average service", "9.2 min"], ["Peak hour", "11:00"]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{l}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{v}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function UseCases() {
  const cases = ["Banks", "Government offices", "College admin desks", "Service centres", "Clinics", "Salons"];
  return (
    <Section id="use-cases" title="Built for anywhere people queue">
      <div className="flex flex-wrap gap-3">
        {cases.map((name) => (
          <span key={name} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700">
            {name}
          </span>
        ))}
      </div>
    </Section>
  );
}

function CallToAction() {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center lg:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Give people their waiting time back
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[17px] leading-relaxed text-slate-300">
          Set up your services and counters in minutes. Customers take tokens from their phones the same day.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100">
            Create an account
          </Link>
          <Link href="/login" className="rounded-lg px-6 py-3 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/10">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">SQ</span>
          <span className="font-medium text-slate-700">SmartQueue</span>
        </div>
        <p>Real-time digital queue and appointment management.</p>
      </div>
    </footer>
  );
}
