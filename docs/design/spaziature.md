# Spaziature

Una scala sola, su base 4px, definita in `src/styles/tokens.css` ed esposta a Tailwind
(`@theme` in `global.css`). Niente valori sparsi come `mt-5` o `pt-7` per l'aria tra le parti
di una pagina: si usano questi.

| Token             | Valore | Utility Tailwind                                       | Quando                                                                             |
| ----------------- | -----: | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `--space-section` |   40px | `pt-section`, `mt-section`, `mb-section`, `pb-section` | tra sezioni principali di una pagina; spazio in fondo alla pagina                  |
| `--space-block`   |   24px | `pt-block`, `mb-block`, `gap-block`                    | titolo di sezione -> contenuto; blocchi dentro una sezione; categorie nel catalogo |
| `--space-items`   |   12px | `gap-items`, `pb-items`                                | tra tile, card e righe di un elenco; descrizione -> tile di un piatto              |
| `--space-title`   |    8px | `mt-title`, `pt-title`, `gap-title`                    | titolo -> sottotitolo o descrizione                                                |
| `--space-header`  |   24px | `pb-header`                                            | sotto la testata delle pagine interne                                              |
| `--page-gutter`   |   16px | `px-4`                                                 | margini laterali di ogni pagina                                                    |

`--grid-gap` (la griglia dei prodotti) è uguale a `--space-items`.

## Come si applicano

- **Sezioni**: `SectionHeader` ha già l'aria giusta. Di default mette 40px sopra e 24px sotto;
  con `lead="block"` ne mette 24 sopra (dopo un campo di ricerca, dentro una sezione), con
  `lead="none"` zero (subito sotto la testata della pagina). La riga descrittiva va nella prop
  `description` (8px sotto il titolo), non in un `<p>` a parte con margini negativi.
- **Testata delle pagine interne**: `PageHeader` (titolo, sottotitolo a 8px, 24px sotto).
- **Pagine**: `main` con `pb-section` in fondo. In home il fondo è più alto (`pb-24`) perché
  "Spesa finita" galleggia sopra l'ultima sezione.
- **Esempio, Ispirazioni**: intro e consiglio (8px tra loro) -> 40px -> "Di stagione questo mese"
  -> 24px -> gruppi (24px tra loro) -> 40px -> "Idee per i piatti" -> 24px -> piatti (40px tra loro;
  dentro un piatto: titolo, 8px, idea, 12px, tile).
- **Schermate di servizio** (errore, onboarding, pannelli): `gap-items`, `gap-block`, `gap-title`
  allo stesso modo; il `BottomSheet` usa 8px sotto il titolo e 12px sopra il piè.

Se serve un valore che non c'è, si discute prima di aggiungerne uno.
