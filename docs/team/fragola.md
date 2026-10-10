# Quaderno di Fragola

Aggiornato da Fragola alla fine di ogni incarico. Il più recente in alto.

## Stato

Frontend di profili, liste multiple e onboarding pronto nel branch `fragola/profili-liste`
(draft PR verso `main`, dipende dalla #16 di Basilio). Provato solo in locale contro il
Supabase locale (migration 0001-0020, utenti di `supabase/checks/seed_dev.sql`).

## Da fare

- Quando Basilio attiva SMTP e conferma email: provare la schermata "Controlla la posta"
  e "Mandala di nuovo" con un'email vera (oggi in locale `enable_signup = false`, la
  registrazione dall'app risponde "registrazioni chiuse").
- Anteprima del link d'invito con immagine Open Graph ("Ti invitano nella lista ...") con
  Paprika: oggi il link mostra l'anteprima generica dell'app.
- Suggerimenti al primo uso (testi-onboarding.md, punto 8) e chip "Per cominciare" nella
  lista vuota: non ancora fatti.
- Banner di installazione con i testi nuovi e solo dopo il primo prodotto (punto 9).
- Messaggio "{nome} ora è nella lista" per chi era già nella lista (toast via realtime).
- Il default della colonna `households.stores` nel database è ancora la lista veneta: il
  frontend imposta `DEFAULT_STORES` subito dopo `create_household`. Meglio cambiare anche
  il default (Basilio).
- i18n: i testi nuovi stanno in `src/i18n/it.ts`; quelli vecchi sono ancora nei componenti.

## Domande aperte per Daniele

- Supermercati di partenza per le liste nuove: Lidl, Eurospin, Conad, Coop, Carrefour, MD,
  Mercato. Vanno bene o preferisci nomi generici ("Supermercato", "Discount", ...)?
- Dopo aver lasciato o eliminato l'ultima lista si torna a "La tua prima lista": ok?

## Diario

### 2026-10-10 - Profili, liste multiple, onboarding, M6 e M8 (#3, #4, #5, #6)

- Profilo unico: nome, colore e foto su `profiles` (`update_my_profile`, foto come
  `avatar_path` nel bucket). Senza foto l'avatar è la mascotte sul colore scelto
  (`public/mascot-avatar.webp`); nel selettore le anteprime della mascotte sui 9 colori e
  "Carica una foto" / "Torna alla mascotte". Via `src/lib/avatars.ts`, `lele.png`,
  `pipi.png`.
- Liste multiple: query `['lists', userId]` con persone e profili, lista aperta salvata
  sul dispositivo (`currentList.ts`), selettore dal titolo della schermata principale,
  Impostazioni con rinomina, persone, invito (Web Share con il messaggio di Zenzero, copia
  link, codice, scadenza, "Nuovo invito"), lascia ed elimina con conferma e avviso per
  l'ultima persona. Realtime per lista più `profiles`. Le schermate si rimontano cambiando
  lista.
- Onboarding: registrazione con il nome, "Controlla la posta", "Come ti chiami?", "La tua
  prima lista", invito; link `/invito/<token>` conservato in `localStorage` durante
  registrazione e accesso, poi "Ti invitano in {lista}".
- Supermercati generici per le liste nuove (#6). Testi allineati alla tabella di Zenzero.
  Errori delle quote (0020) tradotti.
- Audit: M6 (logout svuota cache TanStack su IndexedDB, coda offline e cache
  `supabase-rest`), M8 (font da `@fontsource`, niente Google).
- Verifiche nel browser a 375px: utente da zero (Carla), lista "con altre persone" e
  invito, invito via link tra due utenti (Bruno), Bruno con 2 liste che passa dall'una
  all'altra (analitiche comprese, scelta ricordata dopo il ricaricamento), uscita non
  ultima e uscita dell'ultima persona (lista eliminata, ritorno a "La tua prima lista"),
  codice sbagliato, foto caricata e tolta, logout con IndexedDB svuotato.
