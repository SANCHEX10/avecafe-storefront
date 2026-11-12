import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { BUSINESS_CONFIG } from "@/config/business";
import { localeDirection } from "@/i18n/locales";

const gtmId = process.env.GTM_ID;
const spreeApiOrigin = (() => {
  try {
    return process.env.SPREE_API_URL
      ? new URL(process.env.SPREE_API_URL).origin
      : undefined;
  } catch {
    return undefined;
  }
})();

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

interface DocumentShellProps {
  children: React.ReactNode;
  locale: string;
}

/** Shared document markup for each root layout. */
export function DocumentShell({ children, locale }: DocumentShellProps) {
  return (
    <html lang={locale} dir={localeDirection(locale)} suppressHydrationWarning>
      {/* biome-ignore lint/style/noHeadElement: this shell is used only by Next.js root layouts */}
      <head>
        {spreeApiOrigin && (
          <>
            <link rel="preconnect" href={spreeApiOrigin} />
            <link rel="dns-prefetch" href={spreeApiOrigin} />
          </>
        )}
      </head>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body
        className={`${geist.variable} antialiased min-h-screen flex flex-col`}
        style={
          {
            "--primary": BUSINESS_CONFIG.theme.primary,
            "--primary-foreground": BUSINESS_CONFIG.theme.primaryForeground,
            "--ring": BUSINESS_CONFIG.theme.ring,
            "--brand-hero": BUSINESS_CONFIG.theme.heroSurface,
            "--brand-product": BUSINESS_CONFIG.theme.productSurface,
            "--color-primary-50": BUSINESS_CONFIG.theme.primaryScale[50],
            "--color-primary-100": BUSINESS_CONFIG.theme.primaryScale[100],
            "--color-primary-200": BUSINESS_CONFIG.theme.primaryScale[200],
            "--color-primary-300": BUSINESS_CONFIG.theme.primaryScale[300],
            "--color-primary-400": BUSINESS_CONFIG.theme.primaryScale[400],
            "--color-primary-500": BUSINESS_CONFIG.theme.primaryScale[500],
            "--color-primary-600": BUSINESS_CONFIG.theme.primaryScale[600],
            "--color-primary-700": BUSINESS_CONFIG.theme.primaryScale[700],
            "--color-primary-800": BUSINESS_CONFIG.theme.primaryScale[800],
            "--color-primary-900": BUSINESS_CONFIG.theme.primaryScale[900],
            "--color-primary-950": BUSINESS_CONFIG.theme.primaryScale[950],
          } as React.CSSProperties & Record<string, string>
        }
      >
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
