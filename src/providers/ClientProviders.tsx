'use client'

import { AuthProvider } from '@/components/Auth'
import { ThemeProvider } from '@/lib/ThemeProvider'
import { persistor, store } from '@/redux/store'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  )
}

export default ClientProviders
