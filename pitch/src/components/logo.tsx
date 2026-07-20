export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold tracking-tight ${className ?? ""}`}
    >
      <span className="text-primary">Daily</span>
      <span className="text-foreground">OS</span>
    </span>
  );
}
