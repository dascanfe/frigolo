import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Su iPhone Safari ingrandisce la pagina appena un campo di testo con font
 * sotto i 16px riceve il focus, e non torna indietro da solo: tutta l'app
 * resta zoomata. Nessun <input>/<textarea> deve avere classi di testo piccole.
 */
const SRC = fileURLToPath(new URL('..', import.meta.url))
const SMALL_TEXT = /\btext-(xs|sm|\[(\d|1[0-5])px\])\b/

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return tsxFiles(path)
    return path.endsWith('.tsx') ? [path] : []
  })
}

describe('campi di testo', () => {
  it('nessun campo sotto i 16px (evita lo zoom automatico di iOS)', () => {
    const offenders: string[] = []
    for (const file of tsxFiles(SRC)) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/<(input|textarea)\b[\s\S]*?(\/>|<\/textarea>)/g)) {
        // il tag intero fino a "/>": le arrow function (=>) negli attributi non lo chiudono
        const tag = match[0]
        if (/type="(checkbox|radio|file|range)"/.test(tag)) continue
        if (/className="sr-only"/.test(tag)) continue
        if (SMALL_TEXT.test(tag)) offenders.push(`${file.replace(SRC, '')}: ${tag.slice(0, 80)}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
