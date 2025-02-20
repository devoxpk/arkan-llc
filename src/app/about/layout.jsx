import '../globals.css';

export const metadata = {
  title: 'ARKAN - LLC About',
  description: 'About ARKAN - LLC - Crane Rental',
};

export default function aboutLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/arkanlogo.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
