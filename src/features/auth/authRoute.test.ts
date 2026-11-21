import { describe, expect, it } from 'vitest'
import { FORGOT_PASSWORD_PATH, routeFromPath } from './authRoute'

describe('routeFromPath', () => {
  it('apre "Crea una nuova password" dal suo indirizzo', () => {
    expect(routeFromPath(FORGOT_PASSWORD_PATH)).toBe('forgot-password')
    expect(routeFromPath('/password-dimenticata/')).toBe('forgot-password')
    expect(routeFromPath('/Password-Dimenticata')).toBe('forgot-password')
  })

  it("ogni altro indirizzo porta all'accesso", () => {
    expect(routeFromPath('/')).toBe('login')
    expect(routeFromPath('/catalogo')).toBe('login')
    expect(routeFromPath('/password-dimenticata/altro')).toBe('login')
  })
})
