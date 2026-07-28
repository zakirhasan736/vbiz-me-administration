import LoginView from '@/views/LoginView'
import { Suspense } from 'react'

export const metadata = {
  title: 'VBiz Me - Login',
  description: 'Login to your VBiz Me account',
}

const LoginPage = () => {
  return (
    <Suspense fallback={<div className="mb-6 h-40" aria-hidden />}>
      <LoginView />
    </Suspense>
  )
}

export default LoginPage
