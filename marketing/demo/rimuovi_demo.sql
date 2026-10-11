-- Rimuove i dati dimostrativi creati da dati_demo.sql (solo account sara/luca/marta/ale @frigolo.test).
-- Le liste, le voci, le spese e i profili spariscono a cascata.
delete from public.households where id::text like 'd1000000-%';
delete from auth.users where id::text like 'd0000000-%';
