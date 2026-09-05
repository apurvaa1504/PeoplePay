import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeoplePay — Modern HR & Payroll",
  description: "Enterprise HR, Contracts, Attendance, and Payroll Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#FCFBFD] text-[#26232A] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}