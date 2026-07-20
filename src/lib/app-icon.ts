import { DEFAULT_APP_ICON_B64 } from "./default-app-icon";

/** Turn a stored "data:...;base64,..." icon into an image Response, or fall
 *  back to the default DailyOS icon. Used by the /app-icon routes. */
export function iconResponse(dataUrl: string | null | undefined): Response {
  const m = dataUrl ? /^data:([^;]+);base64,(.*)$/s.exec(dataUrl) : null;
  const type = m ? m[1] : "image/png";
  const b64 = m ? m[2] : DEFAULT_APP_ICON_B64;
  return new Response(new Uint8Array(Buffer.from(b64, "base64")), {
    headers: { "Content-Type": type, "Cache-Control": "no-store" },
  });
}
