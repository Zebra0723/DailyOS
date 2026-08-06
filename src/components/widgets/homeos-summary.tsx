"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import {
  getArrivalsToday,
  getHomeControlScore,
  getMonthlySubscriptionTotal,
  getUpcomingArrivals,
} from "@/lib/homeos/calculations";
import { Button } from "@/components/ui/button";
import { HomeWidgetShell, MiniStat, gbp } from "@/components/widgets/homeos-shell";

const LINKS = [
  { href: "/homeos/subscriptions", label: "Subscriptions" },
  { href: "/homeos/arrivals", label: "Deliveries" },
  { href: "/homeos/rooms", label: "Rooms" },
  { href: "/homeos/devices", label: "Devices" },
];

export function HomeOSSummaryWidget() {
  const { data, ready } = useHomeOSData();

  if (!data) {
    return (
      <HomeWidgetShell
        title="HomeOS"
        icon={Home}
        href="/homeos"
        loading={!ready}
        empty="Your household command centre — subscriptions, deliveries, rooms and devices."
      />
    );
  }

  const { score, label } = getHomeControlScore(data);
  const monthly = getMonthlySubscriptionTotal(data.subscriptions);
  const arrivingToday = getArrivalsToday(data.arrivals).length;
  const upcoming = getUpcomingArrivals(data.arrivals).length;
  const openAlerts = data.alerts.filter((a) => a.status === "Open").length;

  return (
    <HomeWidgetShell title="HomeOS" icon={Home} href="/homeos">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label={label.toLowerCase()} value={score} tone="primary" />
        <MiniStat label="per month" value={gbp(monthly)} />
        <MiniStat
          label={arrivingToday > 0 ? "arriving today" : "deliveries due"}
          value={arrivingToday > 0 ? arrivingToday : upcoming}
          tone={arrivingToday > 0 ? "amber" : "default"}
        />
        <MiniStat
          label="open alerts"
          value={openAlerts}
          tone={openAlerts > 0 ? "red" : "default"}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {LINKS.map((link) => (
          <Button key={link.href} variant="outline" size="sm" asChild>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>
    </HomeWidgetShell>
  );
}
