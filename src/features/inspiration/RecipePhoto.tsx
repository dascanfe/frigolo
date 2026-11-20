import { useState } from 'react'
import { illustrazioneDelPiatto } from './illustrazioni'

interface RecipePhotoProps {
  nome: string
}

/**
 * Illustrazione del piatto, in cima alla scheda: 4:3, caricata solo quando serve
 * (`loading="lazy"`) e con dimensioni esplicite, così la pagina non salta.
 * Se il piatto non ha ancora l'illustrazione, o non si carica (offline e mai
 * vista), non mostra niente. I file stanno in `public/ricette/` e il service
 * worker li tiene in cache a runtime dopo la prima visita (vedi vite.config.ts).
 */
export function RecipePhoto({ nome }: RecipePhotoProps) {
  const src = illustrazioneDelPiatto(nome)
  const [rotta, setRotta] = useState(false)
  if (!src || rotta) return null

  return (
    <div className="px-4 pb-3">
      <img
        src={src}
        alt={nome}
        width={800}
        height={600}
        loading="lazy"
        decoding="async"
        onError={() => setRotta(true)}
        className="block aspect-[4/3] h-auto w-full rounded-2xl bg-[#f5ece1] object-cover"
      />
    </div>
  )
}
