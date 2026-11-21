import type { Metadata, Viewport } from "next";
import { Onest, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const hindi = Tiro_Devanagari_Hindi({
  variable: "--font-tiro",
  subsets: ["devanagari", "latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Happy Birthday, Chammu",
  description: "Welcome to Naman's new era — a birthday page for Chammu, 21 November.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${onest.variable} ${hindi.variable} h-full antialiased`}
    >
      <head>
        {/* Lets CSS hide GSAP-animated elements before hydration, only when JS runs. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface-base text-text-primary">{children}</body>
    </html>
  );
}
