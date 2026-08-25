import type { Metadata } from 'next'
import CalendarClient from '@/components/calendar/CalendarClient'

export const metadata: Metadata = {
  title: 'Calendar — Study',
  description: 'Plan daily study sessions and track history on the calendar.',
}

export default function CalendarPage() {
  return <CalendarClient />
}
