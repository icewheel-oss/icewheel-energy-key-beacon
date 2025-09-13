/*
 * IceWheel Energy
 * Copyright (C) 2025 IceWheel LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "Icewheel Energy Key Beacon",
  description: "A simple application to host a public key for the Tesla Fleet API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css" />
      </head>
      <body className={GeistSans.className}>
        <main className="container py-5">
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
