import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AUTARCH Web Platform',
  description: 'Full-stack web application platform with modern technologies',
  keywords: ['nextjs', 'typescript', 'full-stack', 'web platform'],
  authors: [{ name: 'Hammurabi Coding Company' }],
  creator: 'Hammurabi Coding Company',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://autarch-web.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
