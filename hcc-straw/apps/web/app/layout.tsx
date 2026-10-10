import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/hooks/useToast'
import './globals.css'

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
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
