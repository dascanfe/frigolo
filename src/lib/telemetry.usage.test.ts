import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }))
const finto = {
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'x' } } } }) },
    rpc,
  },
}

/** Un modulo nuovo per ogni test: i tetti valgono "per apertura" */
async function carica() {
  vi.resetModules()
  vi.doMock('./supabase', () => finto)
  return import('./telemetry')
}

/** Aspetta che le chiamate asincrone partite arrivino alla RPC */
async function attendi() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
  await new Promise((r) => setTimeout(r, 30))
}

beforeEach(() => {
  rpc.mockClear()
})

describe('sezioneDelPercorso', () => {
  it('riconosce le sezioni e ignora il resto', async () => {
    const { sezioneDelPercorso } = await carica()
    expect(sezioneDelPercorso('/')).toBe('lista')
    expect(sezioneDelPercorso('/catalogo')).toBe('catalogo')
    expect(sezioneDelPercorso('/catalogo/')).toBe('catalogo')
    expect(sezioneDelPercorso('/ispirazioni')).toBe('ispirazioni')
    expect(sezioneDelPercorso('/analitiche')).toBe('analitiche')
    expect(sezioneDelPercorso('/impostazioni')).toBe('impostazioni')
    expect(sezioneDelPercorso('/dev/icone')).toBeNull()
    expect(sezioneDelPercorso('/qualcosa')).toBeNull()
  })
})

describe('recordVisit', () => {
  it('manda solo il nome della sezione', async () => {
    const { recordVisit } = await carica()
    recordVisit('ispirazioni')
    await attendi()
    expect(rpc).toHaveBeenCalledWith('metrics_record_visit', { p_sezione: 'ispirazioni' })
  })

  it('conta ogni ingresso fino al tetto per sezione, poi si ferma', async () => {
    const { recordVisit, MAX_VISITE_PER_SEZIONE } = await carica()
    for (let i = 0; i < MAX_VISITE_PER_SEZIONE + 15; i++) recordVisit('catalogo')
    recordVisit('lista')
    await attendi()
    const catalogo = rpc.mock.calls.filter(
      (c: unknown[]) => (c[1] as { p_sezione?: string }).p_sezione === 'catalogo',
    )
    expect(catalogo).toHaveLength(MAX_VISITE_PER_SEZIONE)
    // il tetto di una sezione non tocca le altre
    expect(rpc).toHaveBeenCalledWith('metrics_record_visit', { p_sezione: 'lista' })
  })
})

describe('recordRecipe', () => {
  it('manda lo slug del piatto una volta per apertura', async () => {
    const { recordRecipe } = await carica()
    recordRecipe('pasta-e-ceci')
    recordRecipe('pasta-e-ceci')
    await attendi()
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('metrics_record_recipe', { p_piatto: 'pasta-e-ceci' })
  })

  it('scarta tutto ciò che non ha la forma di uno slug', async () => {
    const { recordRecipe } = await carica()
    recordRecipe('Pasta e ceci di mario@example.com')
    recordRecipe('')
    recordRecipe('x'.repeat(61))
    await attendi()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('si ferma al tetto di piatti per apertura', async () => {
    const { recordRecipe, MAX_RICETTE } = await carica()
    for (let i = 0; i < MAX_RICETTE + 10; i++) recordRecipe(`piatto-${i}`)
    await attendi()
    expect(rpc).toHaveBeenCalledTimes(MAX_RICETTE)
  })
})
