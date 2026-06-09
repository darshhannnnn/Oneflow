import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OneFlow - Plan to Bill in One Place",
  description: "Modular Project Management ERP. Manage projects from planning to execution to billing—track tasks, hours, and financials with real-time profitability insights.",
  icons: {
    icon: '/one-flow-inverted.svg',
  },
};

export default function RootLayout({ children }) {
  // Render without server-derived class, and let the pre-hydration script
  // set the correct theme class. suppressHydrationWarning avoids mismatches.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set initial theme early to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var s = localStorage.getItem('theme');
                  var d = s ? s === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.classList.toggle('dark', d);
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <BackgroundWrapper>
            {children}
          </BackgroundWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
