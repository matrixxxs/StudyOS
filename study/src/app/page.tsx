import type { Metadata } from 'next'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard — Study',
  description: 'Track progress across all your study roadmaps.',
}

export default function DashboardPage() {
  return <DashboardClient />
}
