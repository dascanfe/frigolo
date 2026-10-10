/**
 * Verifica dei link nelle email di Auth (conferma, recupero password, cambio email).
 * SOLO IN LOCALE. I link puntano a {{ .SiteURL }}/auth/confirm con token_hash e type;
 * lo script li legge da Mailpit e li apre con verifyOtp da un client pulito, come farebbe
 * la pagina /auth/confirm aperta in un altro browser.
 *
 * Serve la registrazione aperta in locale: in supabase/config.toml mettere
 * temporaneamente `[auth] enable_signup = true` (senza committare), poi
 * `supabase stop && supabase start`, lanciare
 *
 *   node supabase/checks/email_links.mjs
 *
 * e alla fine rimettere il file com'era e riavviare.
 */
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  execFileSync('supabase', ['status', '-o', 'env'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split('\n')
    .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
const url = env.API_URL,
  anon = env.ANON_KEY,
  service = env.SERVICE_ROLE_KEY
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) {
  console.error('email_links: non è uno Supabase locale, mi fermo.')
  process.exit(1)
}
const MAILPIT = 'http://127.0.0.1:54324/api/v1'
const check = (c, m) => {
  console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`)
  if (!c) process.exitCode = 1
}
const fresh = () =>
  createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function lastMail(to, subject) {
  for (let i = 0; i < 20; i++) {
    const { messages } = await (await fetch(`${MAILPIT}/messages`)).json()
    const m = messages.find((x) => x.To.some((t) => t.Address === to) && x.Subject === subject)
    if (m) return (await fetch(`${MAILPIT}/message/${m.ID}`)).json()
    await sleep(500)
  }
  throw new Error(`nessuna email "${subject}" per ${to}`)
}
function link(mail) {
  const hrefs = [...mail.HTML.matchAll(/href="([^"]+auth\/confirm[^"]+)"/g)].map((m) =>
    m[1].replaceAll('&amp;', '&'),
  )
  const u = new URL(hrefs[0])
  return {
    href: hrefs[0],
    all: hrefs,
    path: u.origin + u.pathname,
    token_hash: u.searchParams.get('token_hash'),
    type: u.searchParams.get('type'),
  }
}

const admin = createClient(url, service, { auth: { persistSession: false } })
const email = `nuovo-${Date.now()}@frigolo.test`
const pw = 'prova-locale-12345'

// 1. Conferma della registrazione
const a = fresh()
const { error: se } = await a.auth.signUp({
  email,
  password: pw,
  options: { data: { display_name: 'Nuovo' } },
})
if (se?.code === 'signup_disabled') {
  console.error('email_links: registrazione chiusa in locale, vedi le istruzioni in testa al file.')
  process.exit(2)
}
check(!se, 'registrazione')
const conf = link(await lastMail(email, 'Conferma la tua email'))
console.log('     link:', conf.href.replace(conf.token_hash, '<token_hash>'))
check(
  conf.path === 'https://frigolo.dascanfe.com/auth/confirm' &&
    conf.type === 'email' &&
    conf.token_hash?.length > 20,
  'conferma: link /auth/confirm con token_hash e type=email',
)
check(
  conf.all.length === 2 && conf.all[0] === conf.all[1],
  'conferma: bottone e link scritto uguali',
)
const b = fresh()
const { data: v1, error: ve1 } = await b.auth.verifyOtp({
  token_hash: conf.token_hash,
  type: conf.type,
})
check(
  !ve1 && v1.session && v1.user.email === email,
  'conferma: verifyOtp da un client pulito apre la sessione',
)
const { data: u1 } = await admin.auth.admin.getUserById(v1.user.id)
check(Boolean(u1.user.email_confirmed_at), 'conferma: email confermata')
const { error: again } = await fresh().auth.verifyOtp({
  token_hash: conf.token_hash,
  type: conf.type,
})
check(Boolean(again), 'conferma: il link non si riusa')

// 2. Recupero password: richiesta da un client, link aperto da un altro
const c = fresh()
await c.auth.resetPasswordForEmail(email)
const rec = link(await lastMail(email, 'Scegli una nuova password'))
console.log('     link:', rec.href.replace(rec.token_hash, '<token_hash>'))
check(
  rec.path === 'https://frigolo.dascanfe.com/auth/confirm' && rec.type === 'recovery',
  'recupero: link /auth/confirm con type=recovery',
)
const d = fresh()
const { data: v2, error: ve2 } = await d.auth.verifyOtp({
  token_hash: rec.token_hash,
  type: rec.type,
})
check(!ve2 && v2.session, 'recupero: verifyOtp da un altro client apre la sessione')
const { error: upErr } = await d.auth.updateUser({ password: 'nuova-password-locale-1' })
check(!upErr, 'recupero: nuova password impostata')
const notif = await lastMail(email, 'La password di Frigolo è cambiata')
check(
  notif.HTML.includes('https://frigolo.dascanfe.com'),
  "avviso di password cambiata con il link all'app",
)

// 3. Cambio email (doppia conferma: vecchio e nuovo indirizzo)
const newEmail = `cambio-${Date.now()}@frigolo.test`
const { error: ce } = await d.auth.updateUser({ email: newEmail })
check(!ce, 'cambio email richiesto')
const toOld = link(await lastMail(email, 'Conferma la nuova email'))
const toNew = link(await lastMail(newEmail, 'Conferma la nuova email'))
console.log('     link:', toNew.href.replace(toNew.token_hash, '<token_hash>'))
check(
  toOld.type === 'email_change' &&
    toNew.type === 'email_change' &&
    toOld.token_hash !== toNew.token_hash,
  'cambio email: due link type=email_change diversi',
)
const e1 = await fresh().auth.verifyOtp({ token_hash: toOld.token_hash, type: 'email_change' })
const e2 = await fresh().auth.verifyOtp({ token_hash: toNew.token_hash, type: 'email_change' })
check(!e1.error && !e2.error, 'cambio email: verifyOtp dei due link')
const { data: u3 } = await admin.auth.admin.getUserById(v1.user.id)
check(u3.user.email === newEmail, 'cambio email: indirizzo aggiornato')

await admin.auth.admin.deleteUser(v1.user.id)
console.log(
  process.exitCode ? 'email_links: controlli falliti' : 'email_links: tutti i controlli passati',
)
