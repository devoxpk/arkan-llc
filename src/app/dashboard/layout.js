import Script from "next/script";

export const metadata = {
  title: "NOUVE - Dashboard",
  description: "Dashboard layout",
};

export default function DashboardLayout({ children }) {
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
        
        {/* Adding Canvas for Charts */}
        <canvas
          style={{ display: "none", width: "314px", marginLeft: "24px" }}
          id="financeChart"
          width="500"
          height="300"
        ></canvas>
        <canvas
          style={{ display: "none", width: "314px", marginLeft: "24px" }}
          id="circleGraph"
          width="200"
          height="200"
        ></canvas>

        {/* Scripts for XLSX, Chart.js, and Firebase */}
        <Script
          id="clarity-script-dashboard"
          src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"
          strategy="lazyOnload"
        />
        <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="lazyOnload" />
        <Script
          src="https://www.gstatic.com/firebasejs/7.7.0/firebase-storage.js"
          strategy="lazyOnload"
        />
     </div>
  );
}
