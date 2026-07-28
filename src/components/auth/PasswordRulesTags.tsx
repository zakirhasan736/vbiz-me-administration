import { cn } from '@/utils/cn'
import { getPasswordRules, isPasswordSameAsEmail, PASSWORD_NOT_SAME_AS_EMAIL } from '@/utils/passwordValidation'

type PasswordRulesTagsProps = {
  password: string
  email?: string | null
}

const PasswordRulesTags = ({ password, email }: PasswordRulesTagsProps) => {
  if (!password) return null

  const rules = getPasswordRules(password)
  const sameAsEmail = isPasswordSameAsEmail(password, email)

  return (
    <ul className="flex flex-wrap gap-1.5 pt-0.5" aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={cn(
            'rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-colors',
            rule.met
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400'
          )}
        >
          {rule.label}
        </li>
      ))}
      {sameAsEmail ? (
        <li className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">
          {PASSWORD_NOT_SAME_AS_EMAIL}
        </li>
      ) : null}
    </ul>
  )
}

export default PasswordRulesTags
