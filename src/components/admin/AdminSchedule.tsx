'use client'

import { ScheduleCalendarView } from '@/components/schedules/ScheduleCalendarView'

export default function AdminSchedule() {
  return <ScheduleCalendarView meetingsSource="admin" canManageMeetings />
}
