'use client'

import { Input } from '@/components/ui'
import { cn } from '@/utils/cn'
import type { InputHTMLAttributes } from 'react'

type AdminPasswordFieldProps = {
  id?: string
  label: string
  value: string
  onChange: NonNullable<InputHTMLAttributes<HTMLInputElement>['onChange']>
  placeholder?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
  inputClassName?: string
}

export function AdminPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoComplete = 'new-password',
  inputClassName,
}: AdminPasswordFieldProps) {
  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor={id} className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
        {label}
      </label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={cn(
          'rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold dark:border-white/15 dark:bg-slate-800',
          inputClassName
        )}
      />
    </div>
  )
}
