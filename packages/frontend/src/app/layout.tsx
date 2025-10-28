import type { Metadata } from "next";
import { Toaster } from '@/components/ui/sonner'
import { Roboto } from "next/font/google";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.className} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Toaster position="bottom-right" />
        {children}
      </body>
    </html>
  );
}
