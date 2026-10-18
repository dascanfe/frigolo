-- =============================================================================
-- Analitiche di dascanfe.com - 0001: la landing di Frigolo
--
-- Progetto Supabase: quello delle statistiche di dascanfe.com (non Frigolo).
-- Da eseguire nel pannello SQL di quel progetto, dopo la revisione di Aglio.
--
-- Perché: il piano Free permette due progetti attivi, quindi le visite della
-- landing (www.dascanfe.com/sub/frigolo/) finiscono nelle stesse tabelle del
-- sito (visite, pagine, eventi), scritte dallo stesso raccoglitore /sub/s/c.php.
-- Mancava solo il modo di separarle.
--
-- Cosa fa:
--   1. pagine.sito: colonna calcolata dal percorso ('frigolo' per /sub/frigolo,
--      'dascanfe' per tutto il resto). Calcolata dal database: non servono
--      modifiche a c.php, a ingest() né al tracciante, e vale anche per le
--      righe già presenti;
--   2. due indici per le letture del cruscotto;
--   3. frigolo_obiettivo(): riconosce i clic che contano (Apri Frigolo, caffè,
--      istruzioni di installazione), dal nome dato dal tracciante della landing
--      o, in mancanza, dalla destinazione del link;
--   4. frigolo_landing(da, a): un solo JSON di aggregati per il cruscotto.
--
-- Cosa NON fa: non cancella né riscrive dati, non tocca le policy esistenti,
-- non cambia ingest() né il battito. Il cruscotto di dascanfe.com continua a
-- funzionare com'è (legge con select *, una colonna in più non lo disturba).
-- Nota: quel cruscotto conterà anche le visite alla landing, perché sono
-- pagine del sito; per escluderle andrebbe modificato il suo app.js
-- (decisione di Daniele).
--
-- Accesso: frigolo_landing è security invoker, quindi legge con le regole già
-- in vigore ("lettura proprietario": solo l'account di Daniele). Per non
-- confondere "non autorizzato" con "zero visite" controlla prima di vedere la
-- riga di stato_sistema, che esiste sempre: se non la vede, errore 42501.
-- Così l'email non compare in questo file (il repo è pubblico).
--
-- Idempotente: si può rieseguire senza danni.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Il sito di ogni pagina
-- -----------------------------------------------------------------------------
alter table public.pagine
  add column if not exists sito text
  generated always as (
    case when percorso ~ '^/sub/frigolo(/|$)' then 'frigolo' else 'dascanfe' end
  ) stored;

comment on column public.pagine.sito is 'frigolo per le pagine sotto /sub/frigolo, dascanfe per il resto. Calcolata dal percorso.';

-- -----------------------------------------------------------------------------
-- 2. Indici
-- -----------------------------------------------------------------------------
create index if not exists pagine_sito   on public.pagine (sito, aperta desc);
create index if not exists eventi_pagina on public.eventi (pagina_id);

-- -----------------------------------------------------------------------------
-- 3. I clic che contano
-- Il tracciante della landing (analytics/landing/track.js) li manda con nome
-- 'frigolo:<obiettivo>'. Se sulla landing girasse il tracciante generico
-- (t.js), il nome sarebbe il testo del link: allora si riconoscono dalla
-- destinazione.
-- -----------------------------------------------------------------------------
create or replace function public.frigolo_obiettivo(p_nome text, p_destinazione text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_nome like 'frigolo:%' then left(substr(p_nome, 9), 40)
    when p_destinazione ~* '^https?://(frigolo\.dascanfe\.com|frigolo-app\.vercel\.app)(/|$)' then 'apri-app'
    when p_destinazione ~* '^https?://(www\.)?paypal\.(me|com)/' then 'caffe'
    else null
  end;
$$;

revoke execute on function public.frigolo_obiettivo(text, text) from public, anon;
grant execute on function public.frigolo_obiettivo(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Aggregati per il cruscotto
-- p_da incluso, p_a escluso, al massimo 400 giorni. Giorni in ora italiana.
-- Visita della landing = visita (non di robot) con almeno una pagina sotto
-- /sub/frigolo aperta nel periodo. Nessuna riga singola nel risultato: solo
-- conteggi e classifiche (al massimo 10 voci).
-- -----------------------------------------------------------------------------
create or replace function public.frigolo_landing(p_da timestamptz, p_a timestamptz)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_out jsonb;
begin
  if not exists (select 1 from public.stato_sistema) then
    raise exception 'Non autorizzato.' using errcode = '42501', hint = 'not_owner';
  end if;

  if p_da is null or p_a is null or p_a <= p_da or p_a - p_da > interval '400 days' then
    raise exception 'Periodo non valido (massimo 400 giorni).' using errcode = '22023', hint = 'bad_period';
  end if;

  with
  pag as (
    select p.id, p.visita_id, p.aperta, p.ms_attivi, p.scroll_max
    from public.pagine p
    where p.sito = 'frigolo' and p.aperta >= p_da and p.aperta < p_a
  ),
  vis_tutte as (
    select v.* from public.visite v where v.id in (select visita_id from pag)
  ),
  vis as (
    select * from vis_tutte where not bot
  ),
  pag_ok as (
    select pag.* from pag join vis on vis.id = pag.visita_id
  ),
  ev as (
    select e.visita_id, public.frigolo_obiettivo(e.nome, e.destinazione) as obiettivo,
           -- qualunque link che porta all'app: il pulsante Apri Frigolo e i
           -- link dentro le istruzioni di installazione
           coalesce(e.destinazione ~* '^https?://(frigolo\.dascanfe\.com|frigolo-app\.vercel\.app)(/|$)', false)
             as verso_app
    from public.eventi e
    join pag_ok on pag_ok.id = e.pagina_id
  ),
  per_visita as (
    select vis.id,
           count(pag_ok.id) as pagine,
           coalesce(sum(pag_ok.ms_attivi), 0) as ms,
           exists (select 1 from ev where ev.visita_id = vis.id and ev.obiettivo is not null) as converte
    from vis left join pag_ok on pag_ok.visita_id = vis.id
    group by vis.id
  ),
  giorni as (
    select g::date as giorno
    from generate_series((p_da at time zone 'Europe/Rome')::date,
                         ((p_a - interval '1 microsecond') at time zone 'Europe/Rome')::date,
                         interval '1 day') g
  ),
  classifica as (
    select dim, nome, valore,
           row_number() over (partition by dim order by valore desc, nome) as pos
    from (
      select 'canali' as dim, canale as nome, count(*) as valore from vis group by canale
      union all
      select 'referenti', referente_host, count(*) from vis where referente_host is not null group by referente_host
      union all
      select 'utm_source', utm_source, count(*) from vis where utm_source is not null group by utm_source
      union all
      select 'utm_medium', utm_medium, count(*) from vis where utm_medium is not null group by utm_medium
      union all
      select 'utm_campaign', utm_campaign, count(*) from vis where utm_campaign is not null group by utm_campaign
      union all
      select 'dispositivi', dispositivo, count(*) from vis group by dispositivo
      union all
      select 'sistemi', sistema, count(*) from vis group by sistema
      union all
      select 'paesi', paese, count(*) from vis where paese is not null group by paese
    ) x
    where nome is not null
  )
  select jsonb_build_object(
    'periodo', jsonb_build_object('da', p_da, 'a', p_a),
    'visite',            (select count(*) from vis),
    -- l'impronta cambia ogni notte: è una stima dei visitatori unici per
    -- giorno, sommata sul periodo (chi torna un altro giorno conta di nuovo)
    'visitatori',        (select count(*) from (
                            select distinct impronta, (iniziata at time zone 'Europe/Rome')::date from vis) u),
    'pagine',            (select count(*) from pag_ok),
    'tempo_mediano_ms',  (select percentile_disc(0.5) within group (order by ms_attivi)
                            from pag_ok where ms_attivi > 0),
    'scroll_mediano',    (select percentile_disc(0.5) within group (order by scroll_max)
                            from pag_ok where scroll_max > 0),
    -- rimbalzo: una pagina sola, meno di 10 secondi, nessun clic che conta
    'rimbalzi',          (select count(*) from per_visita where pagine <= 1 and ms < 10000 and not converte),
    'visite_con_obiettivo', (select count(*) from per_visita where converte),
    'visite_verso_app',  (select count(distinct visita_id) from ev where verso_app),
    'robot',             (select count(*) from vis_tutte where bot),
    'obiettivi', coalesce((
      select jsonb_agg(jsonb_build_object('nome', obiettivo, 'clic', clic, 'visite', visite) order by clic desc)
      from (
        select obiettivo, count(*) as clic, count(distinct visita_id) as visite
        from ev where obiettivo is not null group by obiettivo
      ) o
    ), '[]'::jsonb),
    'giorni', coalesce((
      select jsonb_agg(jsonb_build_object(
        'giorno', g.giorno,
        'visite', (select count(*) from vis
                    where (vis.iniziata at time zone 'Europe/Rome')::date = g.giorno),
        'visitatori', (select count(distinct impronta) from vis
                    where (vis.iniziata at time zone 'Europe/Rome')::date = g.giorno),
        'apri_app', (select count(distinct ev.visita_id) from ev join vis on vis.id = ev.visita_id
                    where ev.verso_app
                      and (vis.iniziata at time zone 'Europe/Rome')::date = g.giorno)
      ) order by g.giorno)
      from giorni g
    ), '[]'::jsonb),
    'classifiche', coalesce((
      select jsonb_object_agg(dim, voci) from (
        select dim, jsonb_agg(jsonb_build_object('nome', nome, 'valore', valore) order by pos) as voci
        from classifica where pos <= 10 group by dim
      ) c
    ), '{}'::jsonb)
  ) into v_out;

  return v_out;
end;
$$;

revoke execute on function public.frigolo_landing(timestamptz, timestamptz) from public, anon;
grant execute on function public.frigolo_landing(timestamptz, timestamptz) to authenticated;

comment on function public.frigolo_landing(timestamptz, timestamptz) is 'Aggregati delle visite alla landing di Frigolo per il cruscotto. Legge con le regole di accesso esistenti (solo il proprietario).';

-- Esito: deve dire sito_presente = 1 e funzione_presente = 1
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'pagine' and column_name = 'sito') as sito_presente,
  (select count(*) from pg_proc where proname = 'frigolo_landing') as funzione_presente;
