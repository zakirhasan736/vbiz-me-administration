'use client'

import { AuthProvider } from '@/components/auth/Auth'
import { ThemeProvider } from '@/lib/ThemeProvider'
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
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  )
}

export default ClientProviders
