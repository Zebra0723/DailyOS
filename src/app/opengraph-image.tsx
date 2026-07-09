import { ImageResponse } from "next/og";

export const alt = "DailyOS — Your life admin, finally handled.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card. Draw the logo mark as INLINE svg (not an <img> data URI —
// Satori renders those unreliably, which left the mark blank before).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #f7f2e9 0%, #f0e2cf 100%)",
          color: "#2b2019",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div
            style={{
              display: "flex",
              width: 120,
              height: 120,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #E0864F, #9A3412)",
            }}
          >
            <svg
              width="74"
              height="74"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
              <path d="M8.5 12.2l2.4 2.4 4.6-5.4" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
            <span style={{ color: "#bf502b" }}>Daily</span>
            <span>OS</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 46,
            display: "flex",
            flexDirection: "column",
            fontSize: 82,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
          }}
        >
          <div style={{ display: "flex" }}>Your life admin,</div>
          <div style={{ display: "flex", color: "#bf502b" }}>
            finally handled.
          </div>
        </div>
        <div
          style={{
            marginTop: 30,
            display: "flex",
            fontSize: 32,
            color: "#6b5c4d",
          }}
        >
          Receipts, letters &amp; bookings → tasks, calendar &amp; a tidy vault.
        </div>
      </div>
    ),
    { ...size },
  );
}
