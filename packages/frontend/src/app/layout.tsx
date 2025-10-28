import type { Metadata } from "next";
import { Toaster } from '@/components/ui/sonner'
import { Roboto } from "next/font/google";
import { ThemeProvider } from 'next-themes'
import "./globals.css";

// Google Fonts
const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Contract IQ - AI-Powered Contract Analysis",
  description:
    "Intelligent contract analysis and management powered by AI. Upload, analyze, and manage your contracts with advanced AI insights.",
  keywords: [
    "contract analysis",
    "AI",
    "legal tech",
    "contract management",
    "document analysis",
  ],
  authors: [{ name: "Contract IQ Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {backendUrl && <link rel="preconnect" href={backendUrl} />}
      </head>
      <body className={`${roboto.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="bottom-right" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
