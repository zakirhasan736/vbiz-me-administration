'use client'

import { cn } from '@/utils/cn'
import type { InputHTMLAttributes, MouseEvent } from 'react'

/** Keeps the native picker icon visible in light mode; inverts only in dark mode. */
export const VCARD_DATE_INPUT_PICKER_CLASSES =
  'cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 dark:[&::-webkit-calendar-picker-indicator]:invert'

function tryOpenDatePicker(input: HTMLInputElement) {
  if (input.disabled) return
  try {
    input.showPicker?.()
  } catch {
    // showPicker requires a user gesture; ignore if blocked
  }
}

type VCardDateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function VCardDateInput({ className, onClick, ...props }: VCardDateInputProps) {
  const handleClick = (e: MouseEvent<HTMLInputElement>) => {
    onClick?.(e)
    tryOpenDatePicker(e.currentTarget)
  }

  return (
    <input type="date" onClick={handleClick} className={cn(VCARD_DATE_INPUT_PICKER_CLASSES, className)} {...props} />
  )
}
