import type { Metadata } from 'next'
import { AuthChrome } from './AuthChrome'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthChrome>{children}</AuthChrome>
}
