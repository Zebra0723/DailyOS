import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  "friend-family": "Friend or family",
  "social-media": "Social media",
  google: "Google search",
  youtube: "YouTube",
  reddit: "Reddit",
  "blog-article": "Blog or article",
  "product-hunt": "Product Hunt",
  other: "Other",
};

const SOURCE_ORDER = Object.keys(SOURCE_LABELS);

interface DiscoveryValue {
  source?: string;
  detail?: string | null;
}

export default async function DiscoveryPage() {
  const admin = createServiceClient();

  const { data: allUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>();
  for (const u of allUsers?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  const { data, error } = await admin
    .from("user_state")
    .select("user_id, value, created_at")
    .eq("key", "discovery")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as {
    user_id: string;
    value: DiscoveryValue;
    created_at: string;
  }[];

  const counts: Record<string, number> = {};
  for (const key of SOURCE_ORDER) counts[key] = 0;
  const otherDetails: { email: string; detail: string; date: string }[] = [];

  for (const r of rows) {
    const src = r.value?.source ?? "other";
    counts[src] = (counts[src] ?? 0) + 1;
    if (src === "other" && r.value?.detail) {
      otherDetails.push({
        email: emailMap.get(r.user_id) ?? r.user_id,
        detail: r.value.detail,
        date: r.created_at,
      });
    }
  }

  const total = rows.length;
  const maxCount = Math.max(...Object.values(counts), 1);

  const cell: React.CSSProperties = {
    padding: "8px 10px",
    borderTop: "1px solid #eee6da",
    fontSize: 13,
    verticalAlign: "top",
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
        Discovery
      </h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        How users found DailyOS.{" "}
        <span style={{ fontWeight: 600 }}>{total}</span> response
        {total !== 1 ? "s" : ""} so far.
      </p>

      {error ? (
        <div
          style={{
            background: "#fbe9e7",
            border: "1px solid #f0c4bd",
            borderRadius: 10,
            padding: 14,
            fontSize: 14,
          }}
        >
          Could not load discovery data. Make sure the{" "}
          <code>user_state</code> table exists.
        </div>
      ) : total === 0 ? (
        <p style={{ color: "#6b6157", fontSize: 14 }}>
          No responses yet — the survey shows on first login.
        </p>
      ) : (
        <>
          {/* Bar chart */}
          <div
            style={{
              border: "1px solid #e6ded2",
              borderRadius: 14,
              padding: 20,
              background: "#fffdf9",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SOURCE_ORDER.map((key) => {
                const count = counts[key] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const barWidth = Math.max(
                  (count / maxCount) * 100,
                  count > 0 ? 3 : 0,
                );
                return (
                  <div key={key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>
                        {SOURCE_LABELS[key] ?? key}
                      </span>
                      <span style={{ color: "#6b6157" }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 22,
                        borderRadius: 6,
                        background: "#f2e3d3",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${barWidth}%`,
                          borderRadius: 6,
                          background:
                            "linear-gradient(90deg, #1976a8, #21577d)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* "Other" details */}
          {otherDetails.length > 0 && (
            <div
              style={{
                border: "1px solid #e6ded2",
                borderRadius: 14,
                padding: 16,
                background: "#fffdf9",
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: "0 0 10px",
                }}
              >
                &ldquo;Other&rdquo; responses
              </h2>
              <table style={{ width: "100%" }}>
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      color: "#6b6157",
                      fontSize: 12,
                    }}
                  >
                    <th style={{ padding: "6px 10px" }}>User</th>
                    <th style={{ padding: "6px 10px" }}>Response</th>
                    <th style={{ padding: "6px 10px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {otherDetails.map((d, i) => (
                    <tr key={i}>
                      <td style={{ ...cell, whiteSpace: "nowrap" }}>
                        {d.email}
                      </td>
                      <td style={{ ...cell, wordBreak: "break-word" }}>
                        {d.detail}
                      </td>
                      <td
                        style={{
                          ...cell,
                          whiteSpace: "nowrap",
                          color: "#6b6157",
                        }}
                      >
                        {new Date(d.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent responses */}
          <div
            style={{
              border: "1px solid #e6ded2",
              borderRadius: 14,
              padding: 16,
              background: "#fffdf9",
            }}
          >
            <h2
              style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}
            >
              Recent responses
            </h2>
            <table style={{ width: "100%" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    color: "#6b6157",
                    fontSize: 12,
                  }}
                >
                  <th style={{ padding: "6px 10px" }}>User</th>
                  <th style={{ padding: "6px 10px" }}>Source</th>
                  <th style={{ padding: "6px 10px" }}>Detail</th>
                  <th style={{ padding: "6px 10px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => {
                  const src = r.value?.source ?? "—";
                  return (
                    <tr key={i}>
                      <td style={{ ...cell, whiteSpace: "nowrap" }}>
                        {emailMap.get(r.user_id) ?? r.user_id}
                      </td>
                      <td style={{ ...cell, fontWeight: 500 }}>
                        {SOURCE_LABELS[src] ?? src}
                      </td>
                      <td style={{ ...cell, wordBreak: "break-word" }}>
                        {r.value?.detail ?? "—"}
                      </td>
                      <td
                        style={{
                          ...cell,
                          whiteSpace: "nowrap",
                          color: "#6b6157",
                        }}
                      >
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
