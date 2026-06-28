"use client";

import * as React from "react";

// The only "plan" signal we have without real billing: the ARLEOPRO promo flag.
// Pro (or promo) = unlocked; otherwise Free.
export const PRO_FLAG_KEY = "dailyos-pro-lifetime";
export const PRO_EVENT = "dailyos-pro";

export function setPro(on: boolean) {
  if (on) localStorage.setItem(PRO_FLAG_KEY, "1");
  else localStorage.removeItem(PRO_FLAG_KEY);
  window.dispatchEvent(new Event(PRO_EVENT));
}

/** Reactively read whether the user has Pro unlocked (client-side). */
export function usePro(): { mounted: boolean; pro: boolean } {
  const [state, setState] = React.useState({ mounted: false, pro: false });

  React.useEffect(() => {
    const read = () =>
      setState({ mounted: true, pro: localStorage.getItem(PRO_FLAG_KEY) === "1" });
    read();
    window.addEventListener(PRO_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(PRO_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return state;
}
