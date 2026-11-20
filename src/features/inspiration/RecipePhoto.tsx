import { useState } from 'react'
import { it as t } from '@/i18n/it'
import { fotoDelPiatto } from './fotoCrediti'

interface RecipePhotoProps {
  nome: string
}

/**
 * Foto del piatto finito, in cima alla scheda: 4:3, caricata solo quando serve
 * (`loading="lazy"`) e con dimensioni esplicite, così la pagina non salta.
 * Mentre arriva si vede il colore di superficie del tema. Se il piatto non ha
 * una foto, o la foto non si carica (offline e mai vista), non mostra niente.
 * Le foto stanno in `public/ricette/` e il service worker le tiene in cache
 * a runtime dopo la prima visita (vedi vite.config.ts).
 */
export function RecipePhoto({ nome }: RecipePhotoProps) {
  const foto = fotoDelPiatto(nome)
  const [rotta, setRotta] = useState(false)
  if (!foto || rotta) return null

  return (
    <figure className="px-4 pb-3">
      <img
        src={foto.src}
        alt={nome}
        width={800}
        height={600}
        loading="lazy"
        decoding="async"
        onError={() => setRotta(true)}
        className="block aspect-[4/3] h-auto w-full rounded-2xl bg-surface object-cover ring-1 ring-subtle"
      />
      <figcaption className="pt-1.5 text-right text-[11px] leading-tight text-secondary/80">
        {t.inspiration.photoBy}{' '}
        <a
          href={foto.credito.pagina}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-subtle underline-offset-2"
        >
          {foto.credito.autore} / {foto.credito.fonte}
        </a>
        {/* CC BY e CC BY-SA chiedono di citare la licenza; CC0, Unsplash e Pexels no */}
        {foto.credito.licenza.startsWith('CC BY') && (
          <>
            ,{' '}
            <a
              href={foto.credito.licenzaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-subtle underline-offset-2"
            >
              {foto.credito.licenza}
            </a>
          </>
        )}
      </figcaption>
    </figure>
  )
}
