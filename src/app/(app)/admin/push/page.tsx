"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Wifi, WifiOff } from "lucide-react";
import { sendPushBroadcast, getPushStats } from "./actions";

export const dynamic = "force-dynamic";

export default function AdminPushPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [totalSubs, setTotalSubs] = useState(0);

  useEffect(() => {
    void getPushStats().then((stats) => {
      setConfigured(stats.configured);
      setTotalSubs(stats.totalSubscriptions);
    });
  }, []);

  function handleSend() {
    startSending(async () => {
      setStatus(null);
      const res = await sendPushBroadcast(title, body);
      if (res.ok) {
        setStatus(`Sent to ${res.sent ?? 0} device(s).`);
        setTitle("");
        setBody("");
      } else {
        setStatus(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <Badge
          variant={configured === false ? "destructive" : "success"}
          className="gap-1.5 px-3 py-1"
        >
          {configured === false ? (
            <WifiOff className="h-3 w-3" />
          ) : (
            <Wifi className="h-3 w-3" />
          )}
          VAPID {configured === null ? "..." : configured ? "configured" : "not configured"}
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <Bell className="h-3 w-3" />
          {totalSubs} subscribed device{totalSubs !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Compose */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Send className="h-4 w-4" />
            Broadcast push notification
          </CardTitle>
          <CardDescription>
            Send a notification to every subscribed device. Dead endpoints are
            cleaned up automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="push-title">Title</Label>
            <Input
              id="push-title"
              placeholder="DailyOS"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-body">Message</Label>
            <Textarea
              id="push-body"
              placeholder="What do you want to tell everyone?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSend}
              loading={sending}
              disabled={configured === false}
            >
              <Bell className="h-4 w-4" />
              Send now
            </Button>
            {status && (
              <p className="text-sm text-muted-foreground">{status}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
