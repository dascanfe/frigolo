export interface PasswordChecks {
  longEnough: boolean
  /** true solo se la conferma è stata scritta ed è uguale */
  matches: boolean
  /** la conferma è scritta ma diversa: va segnalato subito */
  mismatch: boolean
  /** tutte le regole rispettate: si può salvare */
  valid: boolean
}

/** Regole della nuova password (la lunghezza minima è quella di supabase/config.toml) */
export function checkNewPassword(
  password: string,
  confirm: string,
  minLength: number,
): PasswordChecks {
  const longEnough = password.length >= minLength
  const matches = confirm.length > 0 && password === confirm
  return {
    longEnough,
    matches,
    mismatch: confirm.length > 0 && password !== confirm,
    valid: longEnough && matches,
  }
}

/** L'errore dice che la sessione aperta dal link non c'è più (scaduta o chiusa altrove) */
export function isSessionGone(error: { code?: string; message: string }): boolean {
  const message = error.message.toLowerCase()
  return (
    error.code === 'session_not_found' ||
    error.code === 'session_expired' ||
    message.includes('session missing') ||
    message.includes('session not found')
  )
}
