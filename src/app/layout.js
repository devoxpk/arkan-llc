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

            <Script id="google-tag-manager" strategy="afterInteractive">
              {`(function(w,d,s,l,i){
                w[l]=w[l]||[];
                w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),
                    dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;
                j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
              })(window, document, 'script', 'dataLayer', 'GTM-MXTW2J3X');`}
            </Script>

            <noscript>
              {`<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MXTW2J3X"
                height="0" width="0" style="display:none;visibility:hidden"></iframe>`}
            </noscript>

            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '376774778541158');
              fbq('track', 'PageView');`}
            </Script>

            <noscript>
              {`<img height="1" width="1" style="display:none"
                src="https://www.facebook.com/tr?id=376774778541158&ev=PageView&noscript=1"
              />`}
            </noscript>
          </body>
        </ReviewVisibilityProvider>
      </AuthProvider>
    </html>
  );
}
