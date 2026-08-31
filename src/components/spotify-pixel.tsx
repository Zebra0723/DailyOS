"use client";

import Script from "next/script";

// Spotify Pixel — measures which visitors from Spotify ad campaigns go on to
// sign up, and builds retargeting/lookalike audiences. Inert until you set
// NEXT_PUBLIC_SPOTIFY_PIXEL_ID, so it costs nothing when you're not running
// Spotify ads.
//
// IMPORTANT: Spotify generates a personalised base snippet in Ads Manager →
// Pixels. This uses the standard Spotify Pixel (`spdt`) loader; if Spotify's
// snippet for your account differs, replace the inline loader below with theirs
// (keep the conversion helper in lib/analytics.ts pointing at `window.spdt`).

const PIXEL_ID = process.env.NEXT_PUBLIC_SPOTIFY_PIXEL_ID;

export function SpotifyPixel() {
  if (!PIXEL_ID) return null;
  return (
    <Script id="spotify-pixel" strategy="afterInteractive">
      {`
        !function(s,p,o,t,i,f,y){
          if(s.spdt)return;
          i=s.spdt=function(){i.callMethod?i.callMethod.apply(i,arguments):i.queue.push(arguments)};
          i.queue=[];f=p.createElement(o);f.async=!0;f.src=t;
          y=p.getElementsByTagName(o)[0];y.parentNode.insertBefore(f,y);
        }(window,document,"script","https://pixel.spotify.com/v1/sp.js");
        spdt('conf',{key:'${PIXEL_ID}'});
        spdt('view');
      `}
    </Script>
  );
}
