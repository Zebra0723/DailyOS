import { ImageResponse } from "next/og";

export const alt = "DailyOS — Your life admin, finally handled.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="160" height="160">
  <defs><linearGradient id="b" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#E0864F"/><stop offset="1" stop-color="#9A3412"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="#ffffff"/>
  <g fill="none" stroke="url(#b)" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" transform="translate(112 112) scale(12)">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
    <path d="M8.5 12.2l2.4 2.4 4.6-5.4" stroke-width="3.4"/>
  </g>
</svg>`;

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={160}
          height={160}
          alt=""
          src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`}
        />
        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          <div style={{ display: "flex" }}>Your life admin,</div>
          <div style={{ display: "flex", color: "#bf502b" }}>
            finally handled.
          </div>
        </div>
        <div style={{ marginTop: 32, display: "flex", fontSize: 34, color: "#6b5c4d" }}>
          DailyOS — your personal chief of staff.
        </div>
      </div>
    ),
    { ...size },
  );
}
