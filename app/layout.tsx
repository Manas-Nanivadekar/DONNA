import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "DONNA - AI Case Study Assistant",
  description:
    "AI-powered case study assistant for Autoscaling Tech, Database Solutions, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head></head>
      <body className={cn(GeistSans.className, "antialiased")}>
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}
