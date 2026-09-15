import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercadata Venezuela | Comparador de Precios de Supermercados",
  description: "Compara precios de productos en Central Madeirense, Gama, Plaza's, Kalea y Farmatodo en tiempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
