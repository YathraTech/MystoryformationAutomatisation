import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MyStoryFormation',
  description:
    'Inscrivez-vous à nos formations en langues éligibles CPF. Centre de formation MyStoryFormation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${montserrat.variable} font-sans bg-slate-50 text-slate-600 antialiased min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900`}
      >
        {children}
      </body>
    </html>
  );
}
