import type { Metadata } from 'next'
import './globals.css'
import ConsoleErrorFilter from '@/components/console-error-filter'

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Modern inventory management system',
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
        {children}
      </body>
    </html>
  )
}