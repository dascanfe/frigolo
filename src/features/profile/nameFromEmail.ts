/** Nome proposto dalla parte dell'email prima della @, solo se sembra un nome */
export function nameFromEmail(email: string | undefined): string {
  const local = email?.split('@')[0] ?? ''
  if (!local || /\d/.test(local)) return ''
  const words = local.split(/[._-]+/).filter(Boolean)
  if (words.length === 0 || words.length > 3) return ''
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}
