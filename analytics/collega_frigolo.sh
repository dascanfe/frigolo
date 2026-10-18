#!/bin/bash
# =============================================================================
# Collega il database di Frigolo al progetto delle statistiche, una volta sola
# (o per cambiare il segreto). Da lanciare dalla cartella del repo collegata al
# progetto Frigolo, DOPO le migration:
#   - Frigolo:      supabase/migrations/0025_metrics_push.sql
#   - statistiche:  analytics/migrations/0002_frigolo_app.sql
#
#   bash analytics/collega_frigolo.sh
#
# Cosa fa, senza mai stampare il segreto:
#   1. genera un segreto casuale di 256 bit in una variabile;
#   2. ne salva l'hash SHA-256 nel progetto delle statistiche
#      (frigolo_app_chiave);
#   3. salva nel Vault di Frigolo il segreto e la chiave pubblica (anon) del
#      progetto delle statistiche;
#   4. lancia un primo invio e controlla che sia arrivato.
# L'output dei comandi che contengono il segreto viene scartato, anche in caso
# di errore (che viene segnalato senza dettagli).
# =============================================================================
set -euo pipefail

STATS=tfihnbahzsjhkssxbgue

segreto=$(openssl rand -hex 32)
hash=$(printf %s "$segreto" | shasum -a 256 | cut -d' ' -f1)
anon=$(supabase projects api-keys --project-ref "$STATS" -o json 2>/dev/null |
  python3 -c 'import json,sys; print([k["api_key"] for k in json.load(sys.stdin) if k.get("id") == "anon"][0])')

if ! supabase db query --linked --project-ref "$STATS" \
  "insert into public.frigolo_app_chiave (id, hash) values (1, '$hash')
   on conflict (id) do update set hash = excluded.hash" >/dev/null 2>&1; then
  echo "errore: hash non salvato nel progetto delle statistiche (c'e' la 0002?)" >&2
  exit 1
fi
echo "hash salvato nel progetto delle statistiche"

salva() { # nome valore
  supabase db query --linked "do \$\$ begin
    if exists (select 1 from vault.secrets where name = '$1') then
      perform vault.update_secret((select id from vault.secrets where name = '$1'), '$2');
    else
      perform vault.create_secret('$2', '$1');
    end if;
  end \$\$" >/dev/null 2>&1
}
if ! salva frigolo_stats_push_secret "$segreto" || ! salva frigolo_stats_anon_key "$anon"; then
  echo "errore: segreti non salvati nel Vault di Frigolo (c'e' la 0025?)" >&2
  exit 1
fi
unset segreto anon
echo "segreti salvati nel Vault di Frigolo"

supabase db query --linked "select metrics.push_snapshot()" >/dev/null 2>&1
echo "primo invio lanciato, controllo fra 15 secondi"
sleep 15
supabase db query --linked --project-ref "$STATS" \
  "select ricevuto, jsonb_object_keys(dati -> 'periodi') as periodo from public.frigolo_app_snapshot" 2>/dev/null
