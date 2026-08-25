import type { Metadata } from 'next'
import HistoryListClient from '@/components/history/HistoryListClient'

export const metadata: Metadata = {
  title: 'History — Study',
  description: 'View history of logged study sessions.',
}

export default function HistoryPage() {
  return <HistoryListClient />
}
