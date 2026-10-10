import { describe, expect, it } from 'vitest'
import { canAddList, hasRoomForPeople } from './limits'

describe('limiti di liste e persone', () => {
  it('al massimo 2 liste', () => {
    expect(canAddList(0)).toBe(true)
    expect(canAddList(1)).toBe(true)
    expect(canAddList(2)).toBe(false)
  })

  it('al massimo 5 persone per lista', () => {
    expect(hasRoomForPeople(4)).toBe(true)
    expect(hasRoomForPeople(5)).toBe(false)
  })
})
