
import type { Metadata } from "next";
import React from 'react';
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import { Navbar, Footer, CartDrawer } from "../components/UI";

export const metadata: Metadata = {
  title: "MicroGreen Labs",
  description: "Smart Microgreens Farming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>
          <div className="min-h-screen bg-gray-50 text-slate-900 flex flex-col">
            <Navbar />
            <CartDrawer />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
