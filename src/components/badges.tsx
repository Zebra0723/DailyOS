import { Badge } from "@/components/ui/badge";
import {
  VAULT_CATEGORY_LABELS,
  type InboxStatus,
  type Priority,
  type VaultCategory,
} from "@/lib/types";

export function StatusBadge({ status }: { status: InboxStatus }) {
  const map: Record<
    InboxStatus,
    { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }
  > = {
    pending: { label: "Pending", variant: "secondary" },
    processing: { label: "Processing…", variant: "default" },
    review: { label: "Needs review", variant: "warning" },
    approved: { label: "Approved", variant: "success" },
    failed: { label: "Failed", variant: "destructive" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function CategoryBadge({ category }: { category: VaultCategory }) {
  return (
    <Badge variant="default">
      {VAULT_CATEGORY_LABELS[category] ?? category}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, "secondary" | "warning" | "destructive"> = {
    low: "secondary",
    medium: "warning",
    high: "destructive",
  };
  return (
    <Badge variant={map[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}
