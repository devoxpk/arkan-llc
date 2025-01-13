import Script from "next/script";
import { ReviewVisibilityProvider } from '../context/ReviewVisibilityContext';
export const metadata = {
  title: "DEVOX - Checkout",
  description: "Checkout layout",
};

export default function CheckoutLayout({ children }) {
  return (
    <ReviewVisibilityProvider>
    <div
    style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      margin: 0,
      padding: 0,
    }}
  >
    {children}
    
    {/* <Script
      id="clarity-script-checkout"
      type="text/javascript"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "ouxc4oeliv");`,
      }}
    /> */}
  </div>
  </ReviewVisibilityProvider>
  );
}
