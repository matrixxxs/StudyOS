import type { Metadata } from 'next'
import AdminPanel from '@/components/admin/AdminPanel'

export const metadata: Metadata = {
  title: 'Admin — Study',
  description: 'Manage study roadmaps, stages, and topics.',
}

export default function AdminPage() {
  return <AdminPanel />
}
