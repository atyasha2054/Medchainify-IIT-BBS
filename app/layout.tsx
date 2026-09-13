import type { Metadata } from "next";
import { Merriweather } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/components/Providers";
import BackgroundPattern from "@/components/BackgroundPattern";
import DockNav from "@/components/DockNav";

const winkRough = Merriweather({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MedChainify",
  description: "MedChainify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="shortcut icon"
          href="https://ik.imagekit.io/tegfbc59i/TATVA/favicon.png"
          type="image/x-icon"
        />
        <meta name="google-adsense-account" content="ca-pub-2893663993061117" />
      </head>
      <body className={`${winkRough.className} relative`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TooltipProvider>
              <BackgroundPattern />
              <main className="pb-20 min-h-screen">{children}</main>
              <DockNav />
            </TooltipProvider>
          </AuthProvider>
          <ToastContainer
            autoClose={3000}
            position="top-right"
            theme="light"
            hideProgressBar
            closeButton={false}
            closeOnClick={true}
            pauseOnHover={true}
            newestOnTop={true}
            rtl={false}
            transition={Slide}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
