import type { Metadata, Viewport } from 'next'
import './globals.css'
import ConsoleErrorFilter from '@/components/console-error-filter'
import { ToastProvider } from '@/components/ui/toast-provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Modern inventory management system',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ConsoleErrorFilter />
        <ToastProvider>
          {children}
        </ToastProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}