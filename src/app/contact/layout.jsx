import '../globals.css';

export const metadata = {
  title: 'ARKAN - LLC Contact',
  description: 'Contact ARKAN - LLC - Crane Rental',
};

export default function contactLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/arkanlogo.png" type="image/png" />
      </head>
      <body style={{backgroundColor: 'white'}}>{children}</body>
    </html>
  );
}
