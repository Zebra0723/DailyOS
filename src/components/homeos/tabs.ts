import {
  LayoutDashboard,
  CreditCard,
  Truck,
  Sofa,
  Cpu,
  FolderLock,
  CalendarDays,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type HomeTab =
  | "dashboard"
  | "subscriptions"
  | "arrivals"
  | "rooms"
  | "devices"
  | "vault"
  | "calendar"
  | "alerts"
  | "settings";

export const HOME_TABS: { key: HomeTab; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "subscriptions", label: "SubscriptionOps", icon: CreditCard },
  { key: "arrivals", label: "ArrivalOps", icon: Truck },
  { key: "rooms", label: "RoomOps", icon: Sofa },
  { key: "devices", label: "DeviceOps", icon: Cpu },
  { key: "vault", label: "Home Vault", icon: FolderLock },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
];
