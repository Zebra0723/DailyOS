"use client";

import * as React from "react";
import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function HomeOSSummaryWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Home className="size-4 text-primary" /> HomeOS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your household command centre — subscriptions, deliveries, rooms, and devices.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { href: "/homeos/subscriptions", label: "Subscriptions" },
            { href: "/homeos/arrivals", label: "Deliveries" },
            { href: "/homeos/rooms", label: "Rooms" },
            { href: "/homeos/devices", label: "Devices" },
          ].map((link) => (
            <Button key={link.href} variant="outline" size="sm" asChild>
              <Link href={link.href}>{link.label} <ArrowRight className="size-3" /></Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
