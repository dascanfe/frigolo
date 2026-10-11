/**
 * Cancella le foto profilo orfane dal bucket `avatars`: file che nessun profilo
 * (né la colonna deprecata household_members.avatar_url) usa più, caricati da
 * più di un giorno. L'elenco viene da `avatar_orphans()` (migration 0023).
 *
 * Senza argomenti mostra solo quanti file sono orfani; con --apply li cancella.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-avatar-orphans.mjs
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-avatar-orphans.mjs --apply
 *
 * La chiave service_role va solo nell'ambiente del comando, mai in un file.
 * In produzione si lancia solo con l'ok di Daniele.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apply = process.argv.includes('--apply')

if (!url || !serviceKey) {
  console.error('Servono SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nell ambiente.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: orphans, error } = await admin.rpc('avatar_orphans')
if (error) {
  console.error('avatar_orphans:', error.message)
  process.exit(1)
}

const names = orphans.map((o) => o.name)
console.log(`File orfani: ${names.length}`)

if (!apply || names.length === 0) {
  if (names.length > 0) console.log('Nessun file cancellato: rilancia con --apply per cancellarli.')
  process.exit(0)
}

let removed = 0
for (let i = 0; i < names.length; i += 100) {
  const batch = names.slice(i, i + 100)
  const { data, error: removeError } = await admin.storage.from('avatars').remove(batch)
  if (removeError) {
    console.error('Cancellazione interrotta:', removeError.message)
    process.exit(1)
  }
  removed += data.length
}
console.log(`File cancellati: ${removed}`)
