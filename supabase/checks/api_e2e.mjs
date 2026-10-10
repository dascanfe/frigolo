/**
 * Verifiche end-to-end sull'API locale (PostgREST, Auth, Storage, edge function).
 * SOLO IN LOCALE: legge URL e chiavi da `supabase status` e si ferma se l'URL non
 * è 127.0.0.1 o localhost. Richiede gli account di seed_dev.sql.
 *
 *   node supabase/checks/api_e2e.mjs
 *
 * Crea un utente usa e getta (zeta@frigolo.test) e lo cancella alla fine con la
 * edge function delete-account.
 */
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  execFileSync('supabase', ['status', '-o', 'env'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split('\n')
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
const url = env.API_URL
const anon = env.ANON_KEY
const service = env.SERVICE_ROLE_KEY
if (!url || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) {
  console.error('api_e2e: non è uno Supabase locale, mi fermo.')
  process.exit(1)
}

let failures = 0
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`)
  if (!ok) failures += 1
}
const admin = createClient(url, service, { auth: { persistSession: false } })
const login = async (email, password) => {
  const c = createClient(url, anon, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${email}: ${error.message}`)
  return c
}

// --- Inviti: solo POST
const alice = await login('alice@frigolo.test', 'frigolo-locale-1')
const aliceToken = (await alice.auth.getSession()).data.session.access_token
const { data: casa } = await admin
  .from('households')
  .select('id, join_code, invite_token')
  .eq('name', 'Casa prova')
  .single()
const countAttempts = async () =>
  (await admin.from('invite_attempts').select('user_id', { count: 'exact', head: true })).count

const before = await countAttempts()
const get = (fn, code) =>
  fetch(`${url}/rest/v1/rpc/${fn}?p_code=${encodeURIComponent(code)}`, {
    headers: { apikey: anon, Authorization: `Bearer ${aliceToken}` },
  })
const wrong = await get('get_household_invite', 'ZZZZ2222')
const right = await get('get_household_invite', casa.invite_token)
const wrongBody = await wrong.json()
const rightBody = await right.json()
check(
  wrong.status === 405 && right.status === 405,
  'anteprima in GET: 405 sia con codice giusto sia sbagliato',
)
check(
  wrongBody.hint === 'use_post' && rightBody.hint === 'use_post',
  'anteprima in GET: stessa risposta',
)
const joinGet = await get('join_household', casa.join_code)
check(joinGet.status === 405, 'join in GET: 405')
check((await countAttempts()) === before, 'in GET nessun effetto')
const { data: post, error: postError } = await alice.rpc('get_household_invite', {
  p_code: casa.invite_token,
})
check(!postError && post?.[0]?.is_member === true, 'anteprima in POST funziona')

// --- Export e cancellazione dell'account
const pw = 'e2e-solo-locale-123'
await admin.auth.admin
  .listUsers()
  .then(({ data }) => data.users.filter((u) => u.email === 'zeta@frigolo.test'))
  .then((old) => Promise.all(old.map((u) => admin.auth.admin.deleteUser(u.id))))
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email: 'zeta@frigolo.test',
  password: pw,
  email_confirm: true,
  user_metadata: { display_name: 'Zeta' },
})
if (createError) throw createError
const uid = created.user.id
const zeta = await login('zeta@frigolo.test', pw)
const { data: own } = await zeta.rpc('create_household', { p_name: 'Solo Zeta' })
await zeta.rpc('join_household', { p_code: casa.invite_token })
const { data: burro } = await admin
  .from('items')
  .select('id')
  .is('household_id', null)
  .eq('name', 'Burro')
  .single()
await zeta.from('list_entries').insert({ household_id: casa.id, item_id: burro.id, added_by: uid })
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const photo = `${uid}/${crypto.randomUUID()}.webp`
const { error: uploadError } = await zeta.storage
  .from('avatars')
  .upload(photo, new Blob([png], { type: 'image/webp' }))
check(!uploadError, 'upload della foto nella propria cartella')
await zeta.rpc('update_my_profile', { p_avatar_path: photo })

const { data: exp, error: exportError } = await zeta.rpc('export_my_data')
check(
  !exportError && exp?.profilo?.nome === 'Zeta' && exp.account.email === 'zeta@frigolo.test',
  'export: account e profilo',
)
const casaExp = exp?.liste?.find((l) => l.nome === 'Casa prova')
check(
  exp?.liste?.length === 2 && casaExp?.in_lista.some((e) => e.prodotto === 'Burro' && e.da_me),
  'export: le due liste con i prodotti in lista',
)
const text = JSON.stringify(exp)
check(
  !text.includes(casa.id) && !/join_code|invite_token/.test(text),
  "export: niente id né codici d'invito",
)

const zetaToken = (await zeta.auth.getSession()).data.session.access_token
const post1 = (body, token) =>
  fetch(`${url}/functions/v1/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body,
  })
check((await post1('{}', zetaToken)).status === 400, 'delete-account senza conferma: 400')
check(
  (await post1('{"confirm":"ELIMINA"}', anon)).status === 401,
  'delete-account con la sola chiave anon: 401',
)
const { data: deleted, error: deleteError } = await zeta.functions.invoke('delete-account', {
  body: { confirm: 'ELIMINA' },
})
check(!deleteError && deleted?.deleted === true, 'delete-account con conferma: cancellato')
check(!(await admin.auth.admin.getUserById(uid)).data?.user, 'utente cancellato')
const head = (table, col, value) =>
  admin.from(table).select(col, { count: 'exact', head: true }).eq(col, value)
check((await head('profiles', 'id', uid)).count === 0, 'profilo cancellato')
check((await head('households', 'id', own)).count === 0, 'la lista in cui era solo è eliminata')
const { data: entry } = await admin
  .from('list_entries')
  .select('added_by')
  .eq('household_id', casa.id)
  .eq('item_id', burro.id)
check(
  entry?.length === 1 && entry[0].added_by === null,
  'la lista condivisa resta, senza riferimenti',
)
check(
  (await admin.storage.from('avatars').list(uid)).data?.length === 0,
  'foto cancellate dallo Storage',
)
await admin.from('list_entries').delete().eq('household_id', casa.id).eq('item_id', burro.id)

console.log(
  failures === 0 ? 'api_e2e: tutti i controlli passati' : `api_e2e: ${failures} controlli falliti`,
)
process.exit(failures === 0 ? 0 : 1)
