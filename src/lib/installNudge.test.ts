import { describe, expect, it } from 'vitest'
import { isInstallNudgeDue, MAX_REAPPEARANCES, REAPPEAR_AFTER_MS } from './installNudge'
import type { InstallNudgeState } from './installNudge'

const base: InstallNudgeState = { dismissals: 0, lastDismissedAt: 0, outcome: null, done: false }
const NOW = 1_800_000_000_000

describe('isInstallNudgeDue', () => {
  it('la prima volta è dovuta subito', () => {
    expect(isInstallNudgeDue(base, NOW)).toBe(true)
  })
  it('chiusa, torna solo dopo 3 giorni', () => {
    const closed = { ...base, dismissals: 1, lastDismissedAt: NOW }
    expect(isInstallNudgeDue(closed, NOW + REAPPEAR_AFTER_MS - 1)).toBe(false)
    expect(isInstallNudgeDue(closed, NOW + REAPPEAR_AFTER_MS)).toBe(true)
  })
  it('ricompare al massimo 3 volte, poi basta', () => {
    const last = { ...base, dismissals: MAX_REAPPEARANCES, lastDismissedAt: NOW }
    expect(isInstallNudgeDue(last, NOW + REAPPEAR_AFTER_MS)).toBe(true)
    const over = { ...base, dismissals: MAX_REAPPEARANCES + 1, lastDismissedAt: NOW }
    expect(isInstallNudgeDue(over, NOW + 100 * REAPPEAR_AFTER_MS)).toBe(false)
  })
  it('se ha già installato non serve più', () => {
    expect(isInstallNudgeDue({ ...base, done: true }, NOW)).toBe(false)
  })
})
