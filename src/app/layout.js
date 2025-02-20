import './globals.css';

export const metadata = {
  title: 'ARKAN - LLC',
  description: 'ARKAN - LLC - Crane Rental',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/arkanlogo.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
