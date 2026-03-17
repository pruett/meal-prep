import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '~/lib/utils'

type AppPageProps = ComponentPropsWithoutRef<'main'>

export function AppPage({
  className,
  children,
  ...props
}: AppPageProps) {
  return (
    <main
      className={cn(
        'page-wrap rise-in mx-auto max-w-5xl px-4 pb-8 pt-14',
        className,
      )}
      {...props}
    >
      {children}
    </main>
  )
}
