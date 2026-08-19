import { PUBLIC_SIGNUP_ENABLED, PUBLIC_SIGNUP_FALLBACK_PATH } from '@/lib/auth/publicSignup'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'VBiz Me - Login',
  description: 'Public registration is closed. Log in to your VBiz Me account.',
}

const RegisterPage = () => {
  if (!PUBLIC_SIGNUP_ENABLED) {
    redirect(PUBLIC_SIGNUP_FALLBACK_PATH)
  }

  return null
}

export default RegisterPage
