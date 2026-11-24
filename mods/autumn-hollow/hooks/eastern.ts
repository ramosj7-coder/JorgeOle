import type { Phase } from '../types'

// US Eastern time worked out by hand: daylight time runs from the second
// Sunday of March, 2:00 EST, to the first Sunday of November, 2:00 EDT.
function nthSunday(year: number, month: number, nth: number): number {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay()

  return 1 + ((7 - first) % 7) + (nth - 1) * 7
}

export function easternOffsetHours(ms: number): number {
  const year = new Date(ms).getUTCFullYear()
  const start = Date.UTC(year, 2, nthSunday(year, 2, 2), 7)
  const end = Date.UTC(year, 10, nthSunday(year, 10, 1), 6)

  return ms >= start && ms < end ? -4 : -5
}

/** The Eastern wall clock at `ms`: hour 0 to 23 and minute. */
export function easternClock(ms: number): { hour: number; minute: number } {
  const local = new Date(ms + easternOffsetHours(ms) * 3_600_000)

  return { hour: local.getUTCHours(), minute: local.getUTCMinutes() }
}

export function phaseAt(ms: number): Phase {
  const { hour, minute } = easternClock(ms)
  const t = hour + minute / 60

  if (t >= 5.5 && t < 8) {
    return 'dawn'
  }

  if (t >= 8 && t < 17) {
    return 'day'
  }

  if (t >= 17 && t < 19.5) {
    return 'dusk'
  }

  return 'night'
}

/** `9:05 PM` in Eastern time. */
export function easternTime(ms: number): string {
  const { hour, minute } = easternClock(ms)
  const h = hour % 12 === 0 ? 12 : hour % 12

  return `${h}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
}
