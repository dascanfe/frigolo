import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { slugPiatto } from './illustrazioni'
import { MESI } from './mesi'

/**
 * Il server conta un piatto aperto con "Come si fa" solo se il suo slug è
 * nell'elenco fisso della migration 0033 (metrics.piatti): se si aggiunge o si
 * rinomina un piatto, serve una migration nuova con l'elenco aggiornato.
 */
const SQL = readFileSync(
  new URL('../../../supabase/migrations/0033_metrics_utilizzo.sql', import.meta.url),
  'utf8',
)

describe('piatti contati dalle metriche', () => {
  it("l'elenco della migration è uguale ai piatti delle Ispirazioni", () => {
    const blocco = SQL.split('insert into metrics.piatti')[1]?.split('on conflict')[0] ?? ''
    const nelServer = [...blocco.matchAll(/\('([a-z0-9-]+)', '/g)].map((m) => m[1])
    const nellApp = MESI.flatMap((m) => m.piatti.map((p) => slugPiatto(p.nome)))
    expect(nelServer.length).toBe(60)
    expect(new Set(nelServer)).toEqual(new Set(nellApp))
  })
})
