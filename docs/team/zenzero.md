# Quaderno di Zenzero

Aggiornato da Zenzero alla fine di ogni incarico. Il più recente in alto.

## Stato

Tono di voce, glossario, testi dell'onboarding, email di sistema, README e modelli delle issue
consegnati sul branch `zenzero/tono-di-voce` (draft PR, in attesa dell'ok di Daniele).

Prossimi incarichi previsti: piano editoriale e annunci di lancio (Fase 3), privacy policy e
termini con Aglio (#12).

## Domande aperte per Daniele

1. **Nome della mascotte:** Frigolo (consigliato, coincide con l'app), oppure Brina, Polo, Gelo.
2. **Sottotitolo della schermata di accesso:** "La lista della spesa sempre in tasca. Per conto
   tuo o in compagnia." oppure una delle due alternative in `testi-onboarding.md`.
3. **"Prodotti" al posto di "articoli"** anche nei conteggi (oggi l'app usa tutti e due).
4. **Mittente delle email:** nome "Frigolo", indirizzo da scegliere con Basilio (per esempio
   `ciao@` o `noreply@` sul dominio verificato in Resend). Si risponde alle email o no?
5. **Caffè nell'app:** una riga in fondo alle Impostazioni va bene, o lo teniamo solo su landing
   e README?

## Note per la squadra

- Fragola: la tabella "Da allineare nell'app di oggi" in fondo a `testi-onboarding.md` elenca i
  testi esistenti da cambiare. Il glossario ha uno schema di chiavi i18n.
- Basilio: `email.md` ha oggetto, anteprima, corpo e bottone per ogni template, più una nota sul
  link PKCE che funziona solo nello stesso browser. Le RPC hanno ancora "household" nei
  messaggi d'errore (e "Esiste gia", "Fai gia" senza accento).
- Paprika: servono tre espressioni della mascotte (contenta, pensierosa, dispiaciuta) e la
  variante con la busta da lettere per "Controlla la posta".

## Diario

### 2026-10-10 - Tono di voce (#13, testi di #5 e #7)

- Studiata la voce attuale dell'app: frasi corte, prima persona di Frigolo ("Salvo...", "Non
  sono riuscito"), festa solo a fine spesa. Tenuta come base.
- Scritti `docs/comunicazione/tono.md`, `glossario.md`, `testi-onboarding.md`, `email.md`.
- Decisioni di lessico: "lista" per le household, "persone" per chi la condivide, "tu" sempre,
  niente "voi" rivolto al gruppo, linguaggio neutro rispetto al genere, "prodotti" nei conteggi,
  "Spesa finita" come unico nome della chiusura.
- README rivisto (non più solo "chi vive con te", "tocco" al posto di "tap", analitiche
  descritte senza parlare di soldi).
- Modelli delle issue in `.github/ISSUE_TEMPLATE/`: problema, idea, domanda; le segnalazioni di
  sicurezza rimandano a SECURITY.md.
