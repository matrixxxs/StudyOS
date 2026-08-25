import type { Metadata } from 'next'
import RoadmapDetailClient from '@/components/roadmap/RoadmapDetailClient'

export const metadata: Metadata = {
  title: 'Roadmap — Study',
  description: 'View progress, stages, and topics for this roadmap.',
}

// Next.js 15+ requires params to be awaited in server components
export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <RoadmapDetailClient roadmapId={id} />
}
