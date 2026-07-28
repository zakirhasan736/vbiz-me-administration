import ResetPasswordView from '@/views/ResetPasswordView'

export const metadata = {
  title: 'VBiz Me - Reset Password',
  description: 'Reset your VBiz Me account password',
}

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>
}

const ResetPasswordPage = async ({ params }: ResetPasswordPageProps) => {
  const { token } = await params
  return <ResetPasswordView token={token} />
}

export default ResetPasswordPage
