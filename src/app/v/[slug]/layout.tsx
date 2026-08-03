import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/** Pass-through — SSR page owns `PublicProfileLayout`. */
export default function PublicVCardSlugLayout({ children }: Props) {
  return children
}
