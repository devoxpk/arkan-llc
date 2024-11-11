import Script from "next/script";

export const metadata = {
  title: "Nouve - Contact",
  description: "Contact layout",
};

export default function ContactLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        
        <Script
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
    </html>
  );
}
