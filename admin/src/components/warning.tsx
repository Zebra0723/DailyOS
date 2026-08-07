export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fdeee0", border: "1px solid #eabf95", borderLeft: "4px solid #21577d", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
      <span style={{ fontSize: 16, lineHeight: "20px" }}>⚠️</span>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "#5a3a22" }}>
        <strong style={{ color: "#21577d" }}>Careful — this is real users&apos; data.</strong>{" "}
        {children}
      </p>
    </div>
  );
}
