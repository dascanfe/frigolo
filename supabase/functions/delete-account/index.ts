// =============================================================================
// Frigolo - edge function delete-account (issue #9, GDPR art. 17)
//
// Cancella l'account di chi la chiama, con tutto ciò che è suo:
//   1. l'utente in auth.users (serve il service role). In cascata spariscono
//      profilo, appartenenza alle liste, tentativi di invito; le liste in cui
//      era l'unica persona vengono eliminate con i loro dati (trigger
//      delete_empty_household); nelle liste condivise restano i prodotti e le
//      spese, con "aggiunto da" e "comprato da" vuoti;
//   2. le foto nella sua cartella del bucket avatars, con la Storage API (il
//      database non permette di cancellare direttamente da storage.objects).
//      Eventuali residui li toglie scripts/cleanup-avatar-orphans.mjs.
//
// Sicurezza: l'identità viene dal JWT dell'utente (verify_jwt in config.toml e
// di nuovo con auth.getUser). Il corpo deve contenere { "confirm": "ELIMINA" }
// per evitare cancellazioni per errore. La service role key resta nell'edge
// runtime (variabile d'ambiente fornita da Supabase), mai nel client.
//
// Chiamata dal frontend:
//   supabase.functions.invoke('delete-account', { body: { confirm: 'ELIMINA' } })
// Poi il frontend fa signOut e pulisce la cache locale.
// =============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2.58.0'

// Domini pubblici dell'app. In locale se ne aggiungono altri con il segreto
// FRIGOLO_DEV_ORIGINS (in config.toml, [edge_runtime.secrets]), che in
// produzione non è impostato.
const ALLOWED_ORIGINS = new Set([
  'https://frigolo.dascanfe.com',
  'https://frigolo-app.vercel.app',
  ...(Deno.env.get('FRIGOLO_DEV_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
])

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':
      origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://frigolo.dascanfe.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Metodo non consentito.', code: 'method_not_allowed' }, 405, origin)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return json({ error: 'Non autenticato.', code: 'not_authenticated' }, 401, origin)
  }

  let confirm: unknown = null
  try {
    confirm = ((await req.json()) as { confirm?: unknown }).confirm
  } catch {
    // corpo assente o non JSON: gestito sotto
  }
  if (confirm !== 'ELIMINA') {
    return json(
      { error: 'Manca la conferma della cancellazione.', code: 'confirm_required' },
      400,
      origin,
    )
  }

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    return json({ error: 'Configurazione mancante.', code: 'server_error' }, 500, origin)
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const userId = userData?.user?.id
  if (userError || !userId) {
    return json({ error: 'Non autenticato.', code: 'not_authenticated' }, 401, origin)
  }

  // 1. account (cascata sul database): è la cosa che conta, va fatta per prima
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    return json(
      { error: "Non sono riuscito a cancellare l'account.", code: 'delete_error' },
      500,
      origin,
    )
  }

  // 2. foto: tutta la cartella avatars/<user_id>/, a pagine di 100. Se qualcosa
  // resta (errore di rete, Storage lento), lo toglie lo script dei file orfani:
  // l'account è già cancellato e la risposta resta positiva.
  const bucket = admin.storage.from('avatars')
  for (let page = 0; page < 50; page++) {
    const { data: files, error: listError } = await bucket.list(userId, { limit: 100 })
    if (listError || !files || files.length === 0) break
    const { error: removeError } = await bucket.remove(files.map((f) => `${userId}/${f.name}`))
    if (removeError || files.length < 100) break
  }

  return json({ deleted: true }, 200, origin)
})
