import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriTrack AI — Smart Food & Spending Intelligence",
  description:
    "Track your nutrition, monitor spending habits, and get AI-powered meal plans and insights powered by Google Gemini and machine learning.",
  keywords: "nutrition tracker, food log, spending tracker, AI meal plan, calorie tracker, health app",
  openGraph: {
    title: "NutriTrack AI",
    description: "Smart Food & Spending Intelligence powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
