import {
  CREATE_CARD_TOUR_STEPS,
  DASHBOARD_TOUR_STEPS,
  resolveTourBackDestination,
  resolveTourRouteForStep,
  type DashboardTourStep,
} from '@/lib/dashboardTour'
import { describe, expect, it } from 'vitest'

const multiPageTour: DashboardTourStep[] = [
  { id: 'home', route: '/', title: 'Home', description: '' },
  { id: 'cards', route: '/vcards', title: 'Cards', description: '' },
]

describe('create-card tour back navigation', () => {
  it('does not invent a dashboard route when steps have no route', () => {
    expect(resolveTourRouteForStep(CREATE_CARD_TOUR_STEPS, 3)).toBeNull()
  })

  it('keeps Back on the editor instead of sending the user to /', () => {
    expect(resolveTourBackDestination(CREATE_CARD_TOUR_STEPS, 3, '/vcards/create')).toBeNull()
    expect(resolveTourBackDestination(CREATE_CARD_TOUR_STEPS, 4, '/vcards/create/services')).toBeNull()
    expect(resolveTourBackDestination(CREATE_CARD_TOUR_STEPS, 1, '/vcards/edit/abc')).toBeNull()
  })

  it('still returns the previous page for multi-route tours', () => {
    expect(resolveTourBackDestination(multiPageTour, 1, '/vcards')).toBe('/')
    expect(resolveTourBackDestination(DASHBOARD_TOUR_STEPS, 2, '/')).toBeNull()
  })
})
