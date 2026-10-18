# Note interne sui documenti legali

Non pubblicare. Punti da far verificare a un professionista, tolti da privacy e termini il 2026-10-17.

## Da privacy.md

1. **Titolare persona fisica senza partita IVA**: va bene così per un servizio gratuito aperto al
   pubblico? Daniele ha scelto città, provincia ed email come recapito: basta, o serve un indirizzo
   postale completo (anche ai sensi del d.lgs. 70/2003 sui servizi della società
   dell'informazione)?
2. **Basi giuridiche**: confermare "contratto" per il servizio e "legittimo interesse" per
   sicurezza e statistiche anonime (serve un bilanciamento scritto?).
3. **Età minima di 14 anni** (art. 2-quinquies del Codice privacy): corretta anche se la base è il
   contratto e non il consenso? Serve un controllo dell'età alla registrazione?
4. **Vercel sul piano Hobby**: il DPA di Vercel dichiara di valere per i piani Pro ed Enterprise e il
   piano Hobby è per uso personale non commerciale (le donazioni sono ammesse). Serve passare a Pro
   per avere un contratto art. 28 con Vercel, o bastano i termini e l'informativa di Vercel?
5. **Trasferimenti negli USA**: Supabase, Vercel, Resend e Cloudflare aderiscono al Data Privacy
   Framework? Verificare l'elenco aggiornato e gli accordi (DPA) da accettare su ciascun pannello.
6. **Strumenti sul dispositivo** (localStorage, IndexedDB, service worker): confermare che sono
   tecnici e che non serve un banner di consenso (art. 122 del Codice privacy e linee guida del
   Garante del 2021 sui cookie).
7. **Statistiche senza cookie** nel progetto di dascanfe.com: confermare che non serve il consenso
   e che il progetto è "lo stesso titolare".
8. **Turnstile**: confermare la base giuridica (legittimo interesse) e se va citato anche nella
   cookie policy della landing.
9. **Donazioni PayPal a persona fisica**: trattamento fiscale (liberalità? redditi diversi?) e
   tempi di conservazione dei dati dei donatori.
10. **Conservazione**: confermare la cancellazione automatica degli account inattivi dopo 24 mesi e
    i tempi di log e backup dei fornitori.
11. **Registro dei trattamenti**: confermare che la versione sintetica in
    `docs/legale/registro-trattamenti.md` è sufficiente.
12. **Valutazione d'impatto (DPIA)**: secondo Aglio non serve (niente dati particolari, niente
    profilazione, niente monitoraggio sistematico); chiedere conferma.

## Da termini.md

1. **Accettazione online**: basta "Registrandoti accetti i termini e l'informativa" con i link
   sotto il pulsante, o serve una casella da spuntare? Serve conservare la versione accettata e la
   data?
2. **Clausole vessatorie** (artt. 1341-1342 c.c. e Codice del consumo): la limitazione di
   responsabilità (punto 9), la sospensione (punto 7) e le modifiche unilaterali (punto 12) sono
   formulate in modo valido verso un consumatore senza doppia approvazione scritta?
3. **Contratto gratuito con un consumatore**: si applicano obblighi del Codice del consumo (per
   esempio diritto di recesso, informazioni precontrattuali) anche se il servizio non ha un prezzo
   ma comporta il trattamento di dati personali (direttiva UE 2019/770 sui contenuti digitali)?
4. **Digital Services Act**: Frigolo conserva contenuti degli utenti (nomi, foto, note) visibili
   solo alle persone della stessa lista. Quali obblighi valgono per un servizio di hosting gestito da
   una persona fisica (punto di contatto, informazioni nei termini, meccanismo di segnalazione,
   motivazione delle decisioni)? I punti 5 e 7 bastano?
5. **Età minima** e gestione dei minori tra 14 e 18 anni.
6. **Donazioni**: la formulazione "non rimborsabile" è corretta? Servono indicazioni fiscali?
7. **Licenza AGPL-3.0 e termini del servizio**: nessun conflitto tra le due cose?
8. **Assenza di partita IVA**: va indicato qualcosa (per esempio che il servizio non è
   un'attività commerciale)?
