/**
 * Su che browser gira l'app, per spiegare come installarla.
 * - 'ios-safari': iPhone/iPad con Safari: niente prompt, si usa Condividi.
 * - 'ios-other': iPhone/iPad con un altro browser (Chrome, Firefox, Edge, app
 *   con browser interno): l'installazione affidabile passa da Safari.
 * - 'other': tutto il resto (Android/Chrome, desktop).
 */
export type InstallPlatform = 'ios-safari' | 'ios-other' | 'other'

const OTHER_IOS_BROWSERS =
  /crios|fxios|edgios|opios|opt\/|gsa\/|fban|fbav|instagram|line\/|twitter|snapchat|linkedin/i

export function detectInstallPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  // iPadOS 13+ si presenta come Mac: lo si riconosce dal touch
  const isIos =
    /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1)
  if (!isIos) return 'other'
  const isSafari =
    /version\/[\d.]+.*safari\//i.test(userAgent) && !OTHER_IOS_BROWSERS.test(userAgent)
  return isSafari ? 'ios-safari' : 'ios-other'
}
