import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heat Pump Decision Support Tool",
  description:
    "A guided, plain-language tool for homeowners navigating the heat pump decision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
