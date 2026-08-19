'use client'

import { Button, Modal } from '@/components/ui'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type ForgotPasswordSentModalProps = {
  open: boolean
  onClose: () => void
  email: string
}

const ForgotPasswordSentModal = ({ open, onClose, email }: ForgotPasswordSentModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="forgot-password-sent-title"
      describedBy="forgot-password-sent-desc"
    >
      <div className="p-6 text-left">
        <div className="bg-primary-600/10 text-primary-600 dark:text-primary-400 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <h3 id="forgot-password-sent-title" className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
          Check your email
        </h3>
        <p id="forgot-password-sent-desc" className="mb-6 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          We sent the next steps if an account exists for{' '}
          <span className="font-semibold break-all text-slate-800 dark:text-slate-200">{email}</span>. Check that inbox
          for a password reset or setup link.
        </p>

        <Link
          href="/login"
          onClick={onClose}
          className="bg-primary-600 hover:bg-primary-700 mb-3 flex w-full items-center justify-center rounded-2xl py-3 text-[13px] font-semibold text-white transition-colors"
        >
          Back to login
        </Link>

        <Button type="button" variant="outline" size="lg" onClick={onClose} className="w-full rounded-2xl">
          Close
        </Button>
      </div>
    </Modal>
  )
}

export default ForgotPasswordSentModal
