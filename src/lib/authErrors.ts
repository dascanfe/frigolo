import type { AuthError } from '@supabase/supabase-js'

/** Traduce gli errori di Supabase Auth in messaggi leggibili in italiano */
export function describeAuthError(error: AuthError | Error | null | undefined): string {
  if (!error) return 'Qualcosa è andato storto. Riprova.'
  const code = 'code' in error ? (error as AuthError).code : undefined
  const status = 'status' in error ? (error as AuthError).status : undefined
  const message = error.message.toLowerCase()

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Email o password sbagliate.'
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'Esiste già un account con questa email: prova ad accedere.'
  }
  if (code === 'weak_password' || message.includes('password should be')) {
    return 'Password troppo debole: usa almeno 8 caratteri.'
  }
  if (code === 'same_password') {
    return 'La nuova password deve essere diversa da quella attuale.'
  }
  if (code === 'email_not_confirmed') {
    return "Devi prima confermare l'email."
  }
  if (code === 'email_address_invalid' || message.includes('valid email')) {
    return 'Indirizzo email non valido.'
  }
  if (code === 'signup_disabled') {
    return 'Le registrazioni sono chiuse.'
  }
  if (code === 'over_email_send_rate_limit' || (status === 429 && message.includes('email'))) {
    return 'Troppe email inviate in poco tempo. Riprova tra qualche minuto.'
  }
  if (status === 429) {
    return 'Troppi tentativi. Aspetta un momento e riprova.'
  }
  if (code === 'otp_expired' || message.includes('expired') || message.includes('invalid')) {
    return 'Link scaduto o non valido. Richiedine uno nuovo.'
  }
  if (message.includes('code verifier') || message.includes('flow state')) {
    return "Il link va aperto nello stesso browser da cui l'hai richiesto."
  }
  if (message.includes('fetch') || message.includes('network')) {
    return 'Nessuna connessione. Controlla la rete e riprova.'
  }
  return error.message
}
