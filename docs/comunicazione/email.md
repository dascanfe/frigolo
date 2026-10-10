# Email di sistema

Testi delle email che manda Supabase Auth (issue #7). Basilio li trasforma in HTML e li mette nei
template di Supabase (`supabase/templates/` e `[auth.email.template.*]` in `config.toml`).
Seguono [tono.md](tono.md).

## Regole comuni

- **Mittente:** `Frigolo` come nome. L'indirizzo lo decide Basilio con Daniele (vedi in fondo).
- **Oggetto:** corto, dice cosa fare. Niente "[Frigolo]" davanti, niente emoji, niente
  maiuscole.
- **Anteprima** (preheader): la riga grigia che si legge nella posta dopo l'oggetto. Completa
  l'oggetto, non lo ripete.
- **Corpo:** 2-4 frasi. Un solo bottone. Sotto il bottone il link scritto per intero, per chi
  non vede i bottoni.
- **Firma:** "Frigolo". In alto la mascotte piccola (con `alt="Frigolo"`).
- **Chiusura:** sempre la riga "Se non hai chiesto tu..." per le email di sicurezza.
- **Niente caffè** nelle email di sistema, niente link ai social.
- Il testo deve leggersi bene anche nella versione solo testo.

Variabili dei template Supabase usate qui:

| Variabile                | Cosa contiene                                               |
| ------------------------ | ----------------------------------------------------------- |
| `{{ .ConfirmationURL }}` | Il link da aprire (conferma, recupero, cambio email)        |
| `{{ .Email }}`           | L'indirizzo dell'account (nel cambio email: quello vecchio) |
| `{{ .NewEmail }}`        | Il nuovo indirizzo, solo nel cambio email                   |
| `{{ .SiteURL }}`         | L'indirizzo dell'app                                        |
| `{{ .Token }}`           | Il codice di 6 cifre, se un giorno si usa al posto del link |

Nota tecnica per Basilio: oggi l'app usa il flusso PKCE e il link funziona solo nel browser da
cui è partita la richiesta. Se si passa a un link con `{{ .TokenHash }}` verso una pagina
`/auth/confirm` dell'app, il link funziona da qualunque browser e la frase "Aprila da questo
telefono" si può togliere dai testi. Da decidere con Fragola.

---

## 1. Conferma della registrazione

Template Supabase: `confirmation` ("Confirm signup").

**Oggetto:** Conferma la tua email

**Anteprima:** Un tocco e la tua lista della spesa è pronta.

**Corpo:**

> Ciao!
>
> Manca un passo per usare Frigolo: conferma che questa email è tua.
>
> **[Conferma l'email]** → `{{ .ConfirmationURL }}`
>
> Il link vale 1 ora. Aprilo dal telefono su cui usi Frigolo.
>
> Se non hai chiesto tu di creare un account su Frigolo, ignora questa email: senza conferma
> l'account non si attiva.
>
> Frigolo

Testo del link sotto il bottone: "Il bottone non funziona? Copia questo link nel browser:"
seguito da `{{ .ConfirmationURL }}`.

La durata del link dipende da `otp_expiry` in `supabase/config.toml` (oggi 3600 secondi, cioè 1
ora). Se cambia, si aggiorna la frase anche qui e nel recupero password.

---

## 2. Recupero password

Template Supabase: `recovery` ("Reset password").

**Oggetto:** Scegli una nuova password

**Anteprima:** Hai chiesto di cambiare la password di Frigolo.

**Corpo:**

> Ciao!
>
> Qualcuno, probabilmente tu, ha chiesto di cambiare la password di Frigolo per
> {{ .Email }}.
>
> **[Scegli la nuova password]** → `{{ .ConfirmationURL }}`
>
> Il link vale 1 ora. Aprilo nello stesso browser da cui l'hai chiesto.
>
> Se non hai chiesto tu, ignora questa email: la password resta quella di prima.
>
> Frigolo

---

## 3. Cambio dell'email

Template Supabase: `email_change` ("Change email address").

Con il cambio email sicuro attivo Supabase manda questa email a tutti e due gli indirizzi,
quello vecchio e quello nuovo. Il testo deve funzionare per entrambi.

**Oggetto:** Conferma la nuova email

**Anteprima:** Da {{ .Email }} a {{ .NewEmail }}: manca solo la conferma.

**Corpo:**

> Ciao!
>
> È stato chiesto di cambiare l'email dell'account Frigolo da **{{ .Email }}** a
> **{{ .NewEmail }}**.
>
> Se va bene, conferma qui sotto.
>
> **[Conferma il cambio]** → `{{ .ConfirmationURL }}`
>
> Se non hai chiesto tu, non toccare niente e cambia la password dall'app: l'email resta quella
> di prima finché nessuno conferma.
>
> Frigolo

---

## 4. Password cambiata (avviso)

Template Supabase: `password_changed_notification`. Facoltativa ma consigliata: avvisa se
qualcun altro è entrato nell'account. Non ha bottone di conferma.

**Oggetto:** La password di Frigolo è cambiata

**Anteprima:** Se l'hai cambiata tu, è tutto a posto.

**Corpo:**

> Ciao!
>
> La password dell'account Frigolo {{ .Email }} è appena cambiata.
>
> Se l'hai cambiata tu, non devi fare niente.
>
> Se non l'hai cambiata tu, scegli subito una nuova password da "Password dimenticata?" nella
> schermata di accesso.
>
> **[Apri Frigolo]** → `{{ .SiteURL }}`
>
> Frigolo

---

## 5. Invito in una lista (se servirà)

Oggi gli inviti passano da codice e link mandati dall'app (WhatsApp, messaggi). Questa email
serve solo se un giorno si potrà invitare scrivendo l'indirizzo email di qualcuno. Non è il
template `invite` di Supabase (quello crea un account dall'amministrazione): andrebbe mandata da
una funzione dell'app. `{nome}`, `{lista}`, `{link}` li riempie quella funzione.

**Oggetto:** {nome} ti invita nella lista "{lista}"

**Anteprima:** Una lista della spesa da tenere aggiornata insieme, su Frigolo.

**Corpo:**

> Ciao!
>
> {nome} usa Frigolo per la lista della spesa e ti invita nella lista **"{lista}"**.
> Entrando la vedi dal tuo telefono e la aggiorni anche tu. È gratis.
>
> **[Entra nella lista]** → `{link}`
>
> Se non conosci {nome} o non ti interessa, ignora questa email: senza il tuo tocco non succede
> niente.
>
> Frigolo

---

## Riepilogo per Basilio

| Template Supabase               | Oggetto                                | Bottone                  |
| ------------------------------- | -------------------------------------- | ------------------------ |
| `confirmation`                  | Conferma la tua email                  | Conferma l'email         |
| `recovery`                      | Scegli una nuova password              | Scegli la nuova password |
| `email_change`                  | Conferma la nuova email                | Conferma il cambio       |
| `password_changed_notification` | La password di Frigolo è cambiata      | Apri Frigolo             |
| (funzione dell'app, futura)     | {nome} ti invita nella lista "{lista}" | Entra nella lista        |

Template Supabase che non usiamo: `magic_link` (accesso senza password, non previsto),
`invite` (inviti dall'amministrazione), `reauthentication`. Se un giorno si attivano, i testi si
scrivono con le stesse regole.
