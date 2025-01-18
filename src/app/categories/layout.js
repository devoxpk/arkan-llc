import Script from "next/script";

export const metadata = {
  title: "DEVOX - Categories",
  description: "Categories layout",
};

export default function CategoriesLayout({ children }) {
  return (
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
    </div>
  );
}
