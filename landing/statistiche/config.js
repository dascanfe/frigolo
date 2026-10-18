// ============================================================
//  Impostazioni del cruscotto di Frigolo.
//
//  Due progetti Supabase, due chiavi pubbliche (anon): sono fatte
//  per stare in una pagina e da sole non leggono niente. Le visite
//  le leggono solo le regole del progetto delle statistiche (solo
//  l'account di Daniele); le metriche dell'app solo metrics_app
//  (solo gli account in metrics.admins).
//
//  Nel repo restano i segnaposto: li sostituisce landing/build.mjs
//  con le variabili d'ambiente STATS_SUPABASE_ANON_KEY e
//  VITE_SUPABASE_ANON_KEY (la stessa dell'app).
// ============================================================

window.CONFIG = {
  analitiche: {
    url:  'https://tfihnbahzsjhkssxbgue.supabase.co',
    anon: '__STATS_ANON_KEY__'
  },
  frigolo: {
    url:  'https://egvodwvnralxttxiovau.supabase.co',
    anon: '__FRIGOLO_ANON_KEY__'
  }
};
