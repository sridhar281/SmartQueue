import {
  BarChart3, CalendarDays, ClipboardList, History, LayoutDashboard, ListOrdered,
  MonitorCog, Settings2, SlidersHorizontal, Ticket, User,
} from "lucide-react";

export interface NavItem { href: string; label: string; icon: typeof Ticket; }

export const customerNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-queue", label: "My queue", icon: Ticket },
  { href: "/services", label: "Services", icon: ClipboardList },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/queue", label: "Live queue", icon: ListOrdered },
  { href: "/admin/counters", label: "Counters", icon: MonitorCog },
  { href: "/admin/services", label: "Services", icon: Settings2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/simulation", label: "Simulation", icon: SlidersHorizontal },
];
