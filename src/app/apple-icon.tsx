import { ImageResponse } from "next/og";

// iOS home-screen icon (PNG) for when DailyOS is added to the home screen.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="180" height="180">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#E0864F"/><stop offset="1" stop-color="#9A3412"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <g fill="none" stroke="#ffffff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" transform="translate(146 146) scale(9.17)">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
    <path d="M8.5 12.2l2.4 2.4 4.6-5.4" stroke-width="3.4"/>
  </g>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={180}
          height={180}
          alt="DailyOS"
          src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`}
        />
      </div>
    ),
    { ...size },
  );
}
