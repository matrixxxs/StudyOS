import { Suspense } from 'react'
import type { Metadata } from 'next'
import LogFormClient from '@/components/log/LogFormClient'

export const metadata: Metadata = {
  title: 'Log Session — Study',
  description: 'Log a study session for your roadmap.',
}

export default function LogPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
          Loading log form…
        </div>
      }
    >
      <LogFormClient />
    </Suspense>
  )
}
