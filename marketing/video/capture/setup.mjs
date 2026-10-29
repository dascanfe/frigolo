import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { here, login } from './lib.mjs'

export const DB = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
export const psql = (args) => execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-q', ...args], { stdio: ['ignore', 'pipe', 'inherit'] }).toString()
export const sql = (q) => psql(['-c', q])
/** Dati demo puliti e due sessioni (Giulia e Lele) */
export async function fresh() {
  psql(['-f', path.resolve(here, '../../demo/dati_demo.sql')])
  return { giulia: await login('giulia'), lele: await login('lele') }
}
