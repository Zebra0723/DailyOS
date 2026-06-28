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
import type { HomeModule } from "@/lib/homeos/types";

/** A HomeOS section = a sidebar item and a route under /homeos. */
export interface HomeSection {
  seg: string; // "" = dashboard at /homeos, else /homeos/<seg>
  label: string;
  icon: LucideIcon;
}

export const HOME_SECTIONS: HomeSection[] = [
  { seg: "", label: "HomeOS Dashboard", icon: LayoutDashboard },
  { seg: "subscriptions", label: "SubscriptionOS", icon: CreditCard },
  { seg: "arrivals", label: "ArrivalOS", icon: Truck },
  { seg: "rooms", label: "RoomOS", icon: Sofa },
  { seg: "devices", label: "DeviceOS", icon: Cpu },
  { seg: "vault", label: "Home Vault", icon: FolderLock },
  { seg: "calendar", label: "Calendar", icon: CalendarDays },
  { seg: "alerts", label: "Alerts", icon: Bell },
  { seg: "settings", label: "Settings", icon: Settings },
];

export function homeHref(seg: string): string {
  return seg ? `/homeos/${seg}` : "/homeos";
}

/** Display name for a module (internal HomeModule values stay as "…Ops"). */
export const MODULE_LABEL: Record<HomeModule, string> = {
  SubscriptionOps: "SubscriptionOS",
  ArrivalOps: "ArrivalOS",
  RoomOps: "RoomOS",
  DeviceOps: "DeviceOS",
  "Home Vault": "Home Vault",
  HomeOS: "HomeOS",
};
