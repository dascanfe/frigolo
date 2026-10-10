# Contribuire a Frigolo

Grazie! Ogni aiuto conta, anche solo una segnalazione.

## Segnalare un problema o proporre un'idea

Apri una [issue](https://github.com/dascanfe/frigolo/issues/new/choose) e racconta:
cosa stavi facendo, cosa ti aspettavi, cosa è successo, che telefono e browser usi.

## Lavorare sul codice

1. Fai un fork e crea un branch dal `main`.
2. Prepara l'ambiente seguendo [docs/SVILUPPO.md](docs/SVILUPPO.md) (serve Docker per Supabase in locale).
3. Prima di aprire la pull request: `pnpm lint`, `pnpm typecheck` e `pnpm test` devono passare.
4. Commit in stile [Conventional Commits](https://www.conventionalcommits.org/it/) (`feat:`, `fix:`, `docs:` ...).

### Convenzioni

- L'interfaccia è in italiano, con gli accenti veri.
- Nei testi si usa solo il trattino semplice `-`, mai quello lungo.
- TypeScript strict, niente `any`.
- Nessuna chiave o dato personale nel repository.

Contribuendo accetti che il tuo codice sia distribuito con licenza [AGPL-3.0](LICENSE).
