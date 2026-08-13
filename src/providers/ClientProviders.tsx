'use client'

import { ThemeProvider } from '@/lib/ThemeProvider'
import AuthProvider from '@/providers/AuthProvider'
import { persistor, store } from '@/redux/store'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Toaster } from 'sonner'

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <Toaster position="top-center" />
          {/* AuthProvider restore is a one-shot fetch; do not put RTK Query auth hooks here. */}
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  )
}

export default ClientProviders
