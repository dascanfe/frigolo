// ============================================================
//  Impostazioni del cruscotto di Frigolo.
//
//  Il progetto delle statistiche del sito: chiave pubblica (anon),
//  fatta per stare in una pagina. Da sola non legge niente: visite e
//  metriche dell'app le leggono solo le regole del progetto, che
//  rispondono solo all'account di Daniele.
//
//  Nel repo resta il segnaposto: lo sostituisce landing/build.mjs
//  con la variabile d'ambiente STATS_SUPABASE_ANON_KEY.
// ============================================================

window.CONFIG = {
  analitiche: {
    url:  'https://tfihnbahzsjhkssxbgue.supabase.co',
    anon: '__STATS_ANON_KEY__'
  }
};
