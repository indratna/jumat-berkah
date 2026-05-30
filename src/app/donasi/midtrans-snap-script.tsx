"use client";

import Script from "next/script";

type MidtransSnapScriptProps = {
  clientKey: string | null;
  isProduction: boolean;
};

function getMidtransSnapSrc(isProduction: boolean) {
  return isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export function MidtransSnapScript({
  clientKey,
  isProduction,
}: MidtransSnapScriptProps) {
  if (!clientKey) {
    return null;
  }

  return (
    <Script
      id="midtrans-snap-js"
      src={getMidtransSnapSrc(isProduction)}
      data-client-key={clientKey}
      strategy="afterInteractive"
    />
  );
}
