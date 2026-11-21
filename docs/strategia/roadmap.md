# Roadmap dopo il lancio

A cura di Salvia. Sono **ipotesi da validare con i dati** di Pepe e i feedback raccolti da Zenzero,
non impegni. Si rivede a fine settimana 4 del lancio e poi una volta al mese.

## Come leggere la tabella

- **Impatto:** quanto può aumentare le liste con 2+ persone o la retention, che sono le metriche
  che contano (vedi [lancio.md](lancio.md#obiettivi-misurabili-proposta-per-pepe)).
- **Sforzo:** lavoro della squadra stimato a grandi linee (S = giorni, M = 1-2 settimane,
  L = più di 2 settimane), più eventuali costi.
- **Segnale per partire:** il dato che deve comparire prima di iniziare. Se il segnale non arriva,
  l'idea aspetta.

## Ordinata per impatto e sforzo

| #   | Idea                                                                                      | Impatto     | Sforzo        | Segnale per partire                                                                                                         |
| --- | ----------------------------------------------------------------------------------------- | ----------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Onboarding e installazione più chiari**                                                 | Alto        | S             | Calo forte tra apertura del link e registrazione, o domande ripetute su "come la installo"                                  |
| 2   | **Invito più facile** (link che apre direttamente la lista, anteprima su WhatsApp curata) | Alto        | S             | Meno del 30% delle liste ha 2+ persone dopo 7 giorni                                                                        |
| 3   | **Notifiche push minime** (es. "Marta ha aggiunto 3 prodotti")                            | Alto        | M             | Richieste esplicite nei feedback; retention a 7 giorni sotto obiettivo. Regole del tono: poche e spegnibili                 |
| 4   | **Play Store tramite TWA**                                                                | Medio-alto  | M + 25 $      | Almeno 30-40% degli utenti su Android, oppure feedback "non mi fido senza store". Serve il test con 12 tester per 14 giorni |
| 5   | **Versione inglese**                                                                      | Medio-alto  | M             | Visite dall'estero sulla landing, o richieste; è anche la condizione per Product Hunt                                       |
| 6   | **Catalogo più ricco e prodotti regionali**                                               | Medio       | S-M           | Molti prodotti creati a mano con lo stesso nome da utenti diversi (Pepe lo vede in forma aggregata)                         |
| 7   | **Più liste o più persone per lista**                                                     | Medio       | S             | Molte liste che arrivano al limite di 5 persone o utenti al limite di 2 liste. Attenzione ai costi                          |
| 8   | **Widget o scorciatoie** (aggiunta rapida dalla home)                                     | Medio       | M-L           | Feedback ricorrenti. Le PWA hanno limiti sui widget: valutare solo dopo Play Store                                          |
| 9   | **Condivisione di ricette** (aggiungi tutti gli ingredienti con un tocco)                 | Medio       | L             | Richieste frequenti nei feedback. È la funzione che più avvicina ai concorrenti a pagamento                                 |
| 10  | **Prezzi e totale della spesa**                                                           | Basso-medio | M             | Solo se richiesto da molti. Oggi è una scelta precisa non contare i soldi: cambiarla va deciso con Daniele                  |
| 11  | **App Store (iOS)**                                                                       | Basso       | L + 99 $/anno | Sconsigliato: costi annui e rischio di rifiuto per app web impacchettate (già deciso)                                       |

## Raccomandazione per i primi 3 mesi

1. **Mesi 1-2:** solo le idee 1 e 2, più le correzioni dai feedback. Sono piccole, costano zero e
   agiscono sulla metrica principale.
2. **Mese 2-3:** una tra Play Store (4) e inglese (5), scelta in base alla quota di utenti Android
   e alle visite dall'estero. Se i due segnali sono pari, prima **Play Store**: il pubblico resta
   italiano e lo store aumenta la fiducia; l'inglese apre un mercato nuovo che va poi promosso da
   zero.
3. **Notifiche push (3)** appena la retention a 7 giorni si rivela il problema principale.
4. Tutto il resto aspetta dati.

## Cosa non fare

- Non aggiungere funzioni per inseguire i concorrenti (ricette, prezzi, Watch) senza segnali.
- Non introdurre pubblicità, funzioni a pagamento o affiliazioni: cambierebbero la promessa
  ("gratis, senza pubblicità") e renderebbero l'uso commerciale anche per Vercel
  ([sostenibilita.md](sostenibilita.md)).
- Non alzare i limiti di liste e persone senza aver misurato quanto pesa ogni utente sul piano
  gratuito di Supabase.
