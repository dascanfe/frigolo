import type { AuthError } from '@supabase/supabase-js'

/** Traduce gli errori di Supabase Auth in messaggi leggibili in italiano */
export function describeAuthError(error: AuthError | Error | null | undefined): string {
  if (!error) return 'Non sono riuscito a entrare. Riprova tra poco.'
  const code = 'code' in error ? (error as AuthError).code : undefined
  const status = 'status' in error ? (error as AuthError).status : undefined
  const message = error.message.toLowerCase()

  if (code === 'captcha_failed' || message.includes('captcha')) {
    return 'Non sono riuscito a verificare che sei una persona. Ricarica la pagina e riprova.'
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Email o password sbagliate.'
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'Questa email ha già un account. Prova ad accedere.'
  }
  if (code === 'weak_password' || message.includes('password should be')) {
    return 'La password deve avere almeno 8 caratteri.'
  }
  if (code === 'same_password') {
    return 'La nuova password deve essere diversa da quella attuale.'
  }
  if (code === 'email_not_confirmed') {
    return "Prima conferma l'email: ti ho mandato un link."
  }
  if (code === 'email_address_invalid' || message.includes('valid email')) {
    return 'Questa email non sembra giusta. Controlla che ci sia la @.'
  }
  if (code === 'signup_disabled') {
    return "Le registrazioni sono chiuse per un po'. Riprova più tardi."
  }
  if (code === 'over_email_send_rate_limit' || (status === 429 && message.includes('email'))) {
    return "Ti ho già mandato un'email da poco. Aspetta qualche minuto e riprova."
  }
  if (status === 429) {
    return 'Troppi tentativi. Aspetta un minuto e riprova.'
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
