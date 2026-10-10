# Sostenibilità dei costi

A cura di Salvia. Dati verificati il 10 ottobre 2026 sulle pagine ufficiali: i piani cambiano,
ricontrollare prima di ogni decisione di spesa. I prezzi sono in dollari come sui siti.

## In breve

- Oggi Frigolo costa **0 €** e può restarlo per qualche centinaio di utenti attivi.
- **Il primo limite che si rompe è l'email, non il database:** Resend gratuito manda 100 email al
  giorno. Un buon giorno di lancio basta a superarlo.
- Il secondo è probabilmente l'**egress di Supabase** (5 GB al mese), che sul piano gratuito è
  conteggiato a livello di organizzazione: va capito se il progetto delle analitiche di
  dascanfe.com è nella stessa organizzazione.
- **Vercel Hobby va bene:** Vercel scrive esplicitamente che chiedere donazioni non è uso
  commerciale. Il passaggio a Cloudflare Pages non è necessario per questo motivo.
- Scenario "è cresciuta": Supabase Pro + Resend Pro = **45 $ al mese**, cioè circa 10-18 caffè al
  mese a seconda dell'importo.

## Soglie per servizio

### Supabase

Fonte: [supabase.com/pricing](https://supabase.com/pricing),
[limiti realtime](https://supabase.com/docs/guides/realtime/limits),
[billing FAQ](https://supabase.com/docs/guides/platform/billing-faq).

| Risorsa                         | Free                 | Pro (25 $/mese)                | Rischio per Frigolo                                 |
| ------------------------------- | -------------------- | ------------------------------ | --------------------------------------------------- |
| Database                        | 500 MB per progetto  | 8 GB, poi 0,125 $/GB           | Basso all'inizio; cresce con lo storico delle spese |
| Utenti attivi al mese (MAU)     | 50.000               | 100.000, poi 0,00325 $/MAU     | Molto basso                                         |
| Egress                          | 5 GB + 5 GB in cache | 250 GB + 250 GB, poi 0,09 $/GB | **Medio**: realtime, catalogo e foto profilo        |
| File storage                    | 1 GB                 | 100 GB                         | Basso se le foto profilo restano piccole            |
| Connessioni realtime simultanee | 200                  | 500                            | **Medio**: ogni app aperta tiene una connessione    |
| Messaggi realtime al secondo    | 100                  | 500                            | Basso                                               |
| Pausa per inattività            | dopo 1 settimana     | no                             | Già coperto dal keep-alive                          |
| Progetti attivi                 | 2                    | -                              | Già al limite (Frigolo + analitiche dascanfe.com)   |

Il Pro include 10 $ al mese di crediti di calcolo che coprono un'istanza Micro, quindi il costo
base resta 25 $.

**Cosa succede se si supera un limite Free:** c'è un periodo di tolleranza, poi Supabase può
mettere i progetti in sola lettura, sospenderli o rispondere con errore 402 a tutte le chiamate.
Le restrizioni si applicano in genere **a tutti i progetti dell'organizzazione**, e una seconda
volta non c'è tolleranza ([billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)).
Per Frigolo significa che un picco potrebbe fermare anche le analitiche del sito, o viceversa.

Quanti utenti reggono 500 MB e 5 GB? **Non lo so e non lo invento:** dipende dal peso reale di una
lista, dello storico e delle connessioni realtime. Pepe e Basilio possono misurarlo in un'ora con i
dati di oggi (4 utenti, mesi di storico): dimensione del database e egress del mese diviso per
utenti attivi. Da quel numero si ricava la soglia vera. Fino ad allora uso le soglie di allarme
qui sotto, in percentuale.

### Resend (email)

Fonte: [resend.com/pricing](https://resend.com/pricing).

| Piano | Prezzo    | Limite                                           |
| ----- | --------- | ------------------------------------------------ |
| Free  | 0 $       | 3.000 email al mese, **100 al giorno**, 3 domini |
| Pro   | 20 $/mese | 50.000 al mese, nessun limite giornaliero        |

Ogni registrazione manda almeno un'email (conferma); si aggiungono recupero password, cambio
email, avviso di password cambiata. Con 100 al giorno, **oltre circa 80-90 registrazioni in un
giorno le conferme iniziano a fallire** e chi si registra resta fuori. Al ritmo normale (dopo il
lancio) 3.000 al mese bastano a lungo.

Da ricordare anche i limiti di Supabase Auth, che con SMTP personalizzato si impostano dal
pannello ([rate limits](https://supabase.com/docs/guides/auth/rate-limits)): Basilio deve
controllare che il limite di email all'ora non sia più basso del picco atteso.

Alternativa da valutare con Basilio: **Brevo** ha un piano gratuito da 300 email al giorno con
SMTP, secondo recensioni del 2026 ([sendlayer](https://sendlayer.com/blog/best-free-smtp-servers/),
[dreamlit](https://dreamlit.ai/blog/brevo-review)); non ho potuto leggere la pagina ufficiale e il
marchio Brevo nelle email del piano gratuito non è chiaro. Cambiare fornitore richiede di
verificare di nuovo il dominio.

### Hosting dell'app: Vercel Hobby o Cloudflare Pages

Fonti: [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines),
[Vercel pricing](https://vercel.com/pricing),
[Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/),
[Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

**La questione "solo uso non commerciale".** Il piano Hobby di Vercel è limitato all'uso personale
non commerciale; è commerciale tutto ciò che porta un guadagno economico a chi partecipa al
progetto (pagamenti dai visitatori, vendita di prodotti, pubblicità, link di affiliazione). Ma la
stessa pagina dice testualmente che **"Asking for Donations does not fall under commercial
usage"**. Frigolo è gratuito, senza pubblicità, con donazioni volontarie: rientra nell'uso Hobby.

Diventerebbe commerciale se si aggiungessero pubblicità, funzioni a pagamento, affiliazioni con
supermercati, o se qualcuno fosse pagato per sviluppare Frigolo.

| Cosa                | Vercel Hobby                          | Cloudflare Pages Free                                 |
| ------------------- | ------------------------------------- | ----------------------------------------------------- |
| Prezzo              | 0 $                                   | 0 $                                                   |
| Traffico            | 100 GB al mese di Fast Data Transfer  | Richieste ai file statici gratuite e illimitate       |
| Build               | incluse                               | 500 al mese, una alla volta                           |
| Uso commerciale     | Vietato, ma le donazioni sono ammesse | Nessun divieto trovato sulla pagina del piano         |
| Piano a pagamento   | Pro 20 $/mese per sviluppatore        | Workers Paid da 5 $/mese (serve solo per le funzioni) |
| Lavoro per cambiare | nessuno                               | Nuovo progetto, DNS, header e redirect da riscrivere  |

**Raccomandazione: restare su Vercel Hobby.** Il motivo che faceva pensare a Cloudflare (uso non
commerciale) non si applica alle donazioni, e un'app statica di questo tipo è lontana dai 100 GB.
Si passa a Cloudflare Pages solo se: (a) il traffico supera il 70% dei 100 GB per due mesi, oppure
(b) Frigolo introduce qualcosa di commerciale. Il cambio costa qualche ora a Basilio, non soldi.

Nota: la landing sta su Aruba (sito di Daniele) e non pesa su questi limiti.

### Altri costi possibili

- **Google Play:** 25 $ una tantum (già nel piano). Per un account personale nuovo serve un test
  chiuso con 12 tester per 14 giorni consecutivi prima di pubblicare, secondo guide di terze parti
  del 2026 ([extendsclass](https://extendsclass.com/blog/google-plays-closed-testing-requirement-what-developers-need-to-know-in-2026),
  [testerscommunity](https://www.testerscommunity.com/guides/how-many-testers-do-you-need-google-play));
  da verificare nella Play Console.
- **Dominio:** già esistente (`dascanfe.com`).
- **Revisione legale della privacy:** consigliata da Aglio prima del lancio; costo non stimato.

## Quante donazioni servono

Commissione PayPal sulle donazioni ricevute in Italia: **3,40% + 0,35 €** per donazione
([tariffe PayPal per commercianti](https://www.paypal.com/it/webapps/mpp/merchant-fees)).

| Caffè da | Netto per Daniele |
| -------- | ----------------- |
| 3 €      | 2,55 €            |
| 5 €      | 4,48 €            |
| 10 €     | 9,31 €            |

Per semplicità e prudenza conto 1 $ = 1 € (il dollaro vale di solito meno dell'euro, quindi il
numero di caffè reale è un po' più basso).

| Scenario                                        | Costo al mese | Caffè da 3 € al mese | Caffè da 5 € al mese |
| ----------------------------------------------- | ------------- | -------------------- | -------------------- |
| Oggi                                            | 0 $           | 0                    | 0                    |
| Solo email (Resend Pro)                         | 20 $          | 8                    | 5                    |
| Solo database (Supabase Pro)                    | 25 $          | 10                   | 6                    |
| Database + email                                | 45 $          | 18                   | 11                   |
| Database + email + Vercel Pro (se mai servisse) | 65 $          | 26                   | 15                   |
| Una tantum: Play Store                          | 25 $          | 10                   | 6                    |

Consiglio: **non passare a un piano a pagamento finché le donazioni accumulate non coprono almeno
3 mesi di quel piano.** Se una soglia viene superata prima, si paga per un mese per non fermare il
servizio e si dice apertamente nel README e sulla landing quanto costa Frigolo e quanto coprono i
caffè (trasparenza, senza toni allarmati: il tono vieta "Frigolo potrebbe sparire").

## Segnali da monitorare (per Pepe)

Controllo settimanale, quotidiano nella settimana di lancio. Soglia gialla = prepararsi, rossa =
agire.

| Segnale                       | Dove si vede              | Gialla | Rossa  | Azione alla rossa                                        |
| ----------------------------- | ------------------------- | ------ | ------ | -------------------------------------------------------- |
| Email inviate al giorno       | Pannello Resend           | 60     | 85     | Resend Pro per il mese, o Brevo se già pronto            |
| Email inviate al mese         | Pannello Resend           | 2.000  | 2.700  | Come sopra                                               |
| Egress Supabase nel mese      | Usage dell'organizzazione | 3 GB   | 4 GB   | Ridurre (cache, foto più leggere) o Supabase Pro         |
| Dimensione database           | Usage del progetto        | 300 MB | 425 MB | Pulizia storico vecchio o Supabase Pro                   |
| Storage file                  | Usage del progetto        | 600 MB | 850 MB | Ridimensionare le foto o Supabase Pro                    |
| Connessioni realtime al picco | Report realtime           | 120    | 170    | Chiudere il canale quando l'app è in background, poi Pro |
| Traffico Vercel nel mese      | Usage di Vercel           | 50 GB  | 70 GB  | Spostare l'app su Cloudflare Pages                       |
| Donazioni ricevute nel mese   | PayPal (solo Daniele)     | -      | -      | Serve per decidere i passaggi a pagamento                |

## Donazioni a una persona fisica in Italia

**Non è consulenza fiscale.** Sono indicazioni generali da verificare con un commercialista prima
del lancio.

- **Che cosa sono le donazioni.** Somme date senza nulla in cambio (chi dona e chi no usa la stessa
  app) sono in linea di principio liberalità, non compensi. Il rischio è che il Fisco le consideri
  **redditi** se sono regolari e collegate a un'attività (per esempio se un giorno ci fossero
  funzioni a pagamento, sponsor o lavoro su commissione). In caso di controllo tocca a chi le
  riceve dimostrare che sono donazioni ([analisi di uno studio legale, fonte di parte](https://avvocaticartellesattoriali.com/2025/09/21/agenzia-delle-entrate-rileva-accrediti-paypal-non-dichiarati-come-difendersi/)).
- **Tenere traccia.** Conviene conservare l'elenco delle donazioni ricevute con data e importo e
  tenerle separate dagli eventuali pagamenti di lavoro (Daniele è anche designer freelance o
  dipendente: il commercialista deve sapere quale).
- **PayPal come conto estero.** Un conto PayPal può essere trattato come conto estero, con obbligo
  di indicarlo nel quadro RW della dichiarazione oltre certe soglie (una fonte cita 15.000 € di
  saldo anche per un solo giorno) ([Trend Online](https://www.trend-online.com/risparmio/conto-corrente-paypal/)).
  Per importi da caffè è difficile arrivarci, ma va chiesto.
- **"Amici e familiari" non va usato per le donazioni.** PayPal definisce le transazioni personali
  come pagamenti "senza che vi sia una donazione o transazione commerciale sottostante"
  ([tariffe consumatori PayPal](https://www.paypal.com/it/digital-wallet/paypal-consumer-fees)).
  Chi dona tramite PayPal.me potrebbe scegliere "amici e familiari" per evitare la commissione:
  è un uso non conforme alle condizioni PayPal e meglio non suggerirlo nei testi.
- **Domande da portare al commercialista:**
  1. Le donazioni volontarie per un software gratuito vanno dichiarate? Come?
  2. Cambia qualcosa se diventano regolari (per esempio 20-50 al mese)?
  3. Le spese per i servizi (Supabase, Resend, Play Store) sono deducibili o compensabili?
  4. Serve un conto PayPal Business invece di quello personale?
  5. Quando conviene un'associazione o un'altra forma per raccogliere donazioni?
