import { describe, expect, it } from 'vitest'
import { detectInstallPlatform } from './installPlatform'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1'
const IPHONE_FIREFOX =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15'
const IPHONE_INSTAGRAM =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0'
const IPAD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const MAC_SAFARI = IPAD_SAFARI

describe('detectInstallPlatform', () => {
  it('riconosce Safari su iPhone', () => {
    expect(detectInstallPlatform(IPHONE_SAFARI)).toBe('ios-safari')
  })
  it('riconosce gli altri browser su iPhone', () => {
    expect(detectInstallPlatform(IPHONE_CHROME)).toBe('ios-other')
    expect(detectInstallPlatform(IPHONE_FIREFOX)).toBe('ios-other')
    expect(detectInstallPlatform(IPHONE_INSTAGRAM)).toBe('ios-other')
  })
  it('iPad con Safari in modalità desktop conta come iOS, un Mac vero no', () => {
    expect(detectInstallPlatform(IPAD_SAFARI, 5)).toBe('ios-safari')
    expect(detectInstallPlatform(MAC_SAFARI, 0)).toBe('other')
  })
  it('Android e desktop sono "other"', () => {
    expect(detectInstallPlatform(ANDROID_CHROME, 5)).toBe('other')
  })
})
