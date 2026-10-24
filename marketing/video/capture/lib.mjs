// Strumenti comuni per catturare l'app in locale con Playwright (schermo iPhone 390x844, scala 3).
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const here = path.dirname(fileURLToPath(import.meta.url))
export const BASE = 'http://127.0.0.1:5199'
export const PASS = 'frigolo-demo-1'
// Viewport sotto la status bar iOS (48 pt): 390x796. La barra e l'indicatore Home si aggiungono dopo.
export const VW = 390
export const VH = 796

let browser
export const launch = async () => (browser ??= await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }))
export const close = async () => browser?.close()

export async function newCtx(storageState, theme = 'lampone', dsf = 3) {
  const b = await launch()
  const ctx = await b.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: dsf,
    isMobile: true,
    hasTouch: true,
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    storageState,
    serviceWorkers: 'block',
  })
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('frigolo.theme', t); localStorage.setItem('frigolo.tips', '{}') } catch {}
  }, theme)
  // area sicura in basso come un iPhone con Home indicator (la barra in alto è fuori dal viewport)
  await ctx.addInitScript(() => {
    const s = document.createElement('style')
    s.textContent = ':root{--safe-bottom:34px !important}'
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s))
  })
  return ctx
}

export async function login(user) {
  const file = path.join(here, `.state-${user}.json`)
  const ctx = await newCtx(undefined)
  const page = await ctx.newPage()
  await page.goto(BASE)
  await page.getByLabel('Email').fill(`${user}@frigolo.test`)
  await page.locator('input[type=password]').fill(PASS)
  await page.locator('input[type=password]').press('Enter')
  await page.waitForTimeout(2500)
  await ctx.storageState({ path: file })
  await ctx.close()
  return file
}
