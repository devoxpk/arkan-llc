import localFont from "next/font/local";
import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "./context/AuthContext";
import Image from 'next/image';
import React from 'react';
import { ReviewVisibilityProvider } from './context/ReviewVisibilityContext';

// Define custom fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Metadata for the page
export const metadata = {
  title: "DEVOX",
  description: "ANIME EMBROIDERY IN PAKISTAN",
};

// Root layout component
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
  {/* Google Fonts links */}
  <link
    href="https://fonts.googleapis.com/css2?family=Alkatra&family=Berkshire+Swash&family=Comic+Neue:wght@700&family=Gentium+Book+Plus:wght@400;700&family=Lato:ital,wght@0,400;0,700;0,900;1,700&family=Lexend+Deca:wght@500&family=Lexend:wght@500&family=Montserrat:wght@500&family=Open+Sans:wght@500;800&family=Roboto:wght@100;400&family=Sue+Ellen+Francisco&family=Work+Sans:wght@400;700;900&display=swap"
    rel="stylesheet"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Spartan:wght@100;200;300;400;500;600;700;800;900&display=swap"
    rel="stylesheet"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700;900&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap"
    rel="stylesheet"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  {/* Add the Outfit font */}
  <link
    rel="preconnect"
    href="https://fonts.googleapis.com"
  />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossOrigin="true"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
    rel="stylesheet"
  />
</head>

      <AuthProvider>
        <ReviewVisibilityProvider>
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            {children}

            {/* Adding Ionicons scripts */}
            <Script
              type="module"
              src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
              strategy="afterInteractive"
            />
            <Script
              noModule
              src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"
              strategy="afterInteractive"
            />

            {/* Clarity analytics script */}
            <Script
              id="clarity-script"
              type="text/javascript"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `(function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "ouxc4oeliv");`,
              }}
            />
          </body>
        </ReviewVisibilityProvider>
      </AuthProvider>
    </html>
  );
}
