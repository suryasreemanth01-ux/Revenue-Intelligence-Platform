import './globals.css';

export const metadata = {
  title: 'Revenue Intelligence',
  description: 'Account risk signals and expansion opportunities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}