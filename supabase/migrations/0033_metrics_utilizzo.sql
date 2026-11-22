-- =============================================================================
-- Frigolo - 0033: utilizzo delle sezioni e delle ricette (app 2.6.0)
--
-- Perché: capire se le novità interessano. Quante volte si apre ogni sezione
-- dell'app, quante persone diverse la aprono, quante volte si tocca "Come si
-- fa" per leggere una ricetta e quali piatti si leggono di più.
--
-- Cosa fa:
--   1. metrics.piatti: i 60 piatti delle Ispirazioni (slug e nome). Sono testi
--      di Frigolo, non degli utenti: lo slug inviato dall'app si accetta solo
--      se è in questo elenco, altrimenti il piatto si scarta;
--   2. metrics.event_days (utente, giorno, evento): come active_days, serve
--      solo a contare le persone diverse che aprono una sezione o una ricetta.
--      Solo per gli eventi di questa migration (elenco chiuso nel check).
--      Tenuta 180 giorni, cancellata con l'account (on delete cascade verso
--      auth.users, come active_days), mai esposta riga per riga;
--   3. public.metrics_record_visit(p_sezione): ingresso in una sezione, da un
--      elenco chiuso. Limite proprio ('visita', 200 l'ora): il limite
--      'evento' (60 l'ora) è condiviso da tutti i gesti e le visite lo
--      consumerebbero, togliendo dati agli altri;
--   4. public.metrics_record_recipe(p_piatto): tocco su "Come si fa" (apertura
--      della ricetta), con il piatto solo se è in metrics.piatti. Limite
--      'ricetta', 60 l'ora;
--   5. metrics.utilizzo(da, a): visite e persone per sezione, aperture di
--      "Come si fa", persone che guardano le ricette, piatti più letti,
--      andamento per giorno. Entra in metrics_app e nell'istantanea oraria;
--   6. job notturno: event_days solo per 180 giorni.
--
-- Contatori in metrics.daily_counts: vis_<sezione>, come_si_fa,
-- piatto_<slug>. Giorno = data in ora italiana. Account esclusi ignorati.
--
-- Idempotente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. I piatti delle Ispirazioni (src/features/inspiration/mesi.ts; un test
--    controlla che l'elenco qui sotto sia uguale a quello dell'app)
-- -----------------------------------------------------------------------------
create table if not exists metrics.piatti (
  slug  text primary key,
  nome  text not null
);

comment on table metrics.piatti is 'Piatti delle Ispirazioni di Frigolo (testi dell app, non degli utenti). Solo questi slug si contano.';

insert into metrics.piatti (slug, nome) values
  ('pasta-e-ceci', 'Pasta e ceci'),
  ('ribollita', 'Ribollita'),
  ('risotto-al-radicchio', 'Risotto al radicchio'),
  ('spezzatino-con-patate', 'Spezzatino con patate'),
  ('torta-all-arancia', 'Torta all''arancia'),
  ('orecchiette-con-le-cime-di-rapa', 'Orecchiette con le cime di rapa'),
  ('minestrone-di-stagione', 'Minestrone di stagione'),
  ('polenta-e-salsiccia', 'Polenta e salsiccia'),
  ('frittata-di-carciofi', 'Frittata di carciofi'),
  ('chiacchiere', 'Chiacchiere'),
  ('risotto-agli-asparagi', 'Risotto agli asparagi'),
  ('carciofi-alla-romana', 'Carciofi alla romana'),
  ('spaghetti-alle-alici', 'Spaghetti alle alici'),
  ('sfoglia-di-spinaci-e-ricotta', 'Sfoglia di spinaci e ricotta'),
  ('agnello-al-forno-con-patate', 'Agnello al forno con patate'),
  ('vignarola', 'Vignarola'),
  ('pasta-con-gli-asparagi', 'Pasta con gli asparagi'),
  ('seppie-con-i-piselli', 'Seppie con i piselli'),
  ('frittata-alle-erbe', 'Frittata alle erbe'),
  ('crostata-di-fragole', 'Crostata di fragole'),
  ('bruschette-con-fave-e-ricotta', 'Bruschette con fave e ricotta'),
  ('spaghetti-alle-zucchine', 'Spaghetti alle zucchine'),
  ('patate-novelle-al-forno', 'Patate novelle al forno'),
  ('pollo-al-limone', 'Pollo al limone'),
  ('rucola-fragole-e-grana', 'Rucola, fragole e grana'),
  ('insalata-di-riso', 'Insalata di riso'),
  ('pasta-al-pesto-genovese', 'Pasta al pesto genovese'),
  ('zucchine-ripiene', 'Zucchine ripiene'),
  ('parmigiana-di-melanzane', 'Parmigiana di melanzane'),
  ('macedonia-di-frutta', 'Macedonia di frutta'),
  ('pasta-alla-norma', 'Pasta alla Norma'),
  ('peperonata', 'Peperonata'),
  ('insalata-di-polpo-e-patate', 'Insalata di polpo e patate'),
  ('panzanella', 'Panzanella'),
  ('fiori-di-zucca-fritti', 'Fiori di zucca fritti'),
  ('spaghetti-con-i-pomodorini-freschi', 'Spaghetti con i pomodorini freschi'),
  ('zucchine-alla-scapece', 'Zucchine alla scapece'),
  ('pollo-con-i-peperoni', 'Pollo con i peperoni'),
  ('pomodori-ripieni-di-riso', 'Pomodori ripieni di riso'),
  ('pesche-al-vino', 'Pesche al vino'),
  ('risotto-ai-porcini', 'Risotto ai porcini'),
  ('pesce-spada-alla-siciliana', 'Pesce spada alla siciliana'),
  ('fagiolini-e-patate-in-umido', 'Fagiolini e patate in umido'),
  ('caponata', 'Caponata'),
  ('schiacciata-all-uva', 'Schiacciata all''uva'),
  ('risotto-alla-zucca', 'Risotto alla zucca'),
  ('polenta-e-funghi', 'Polenta e funghi'),
  ('pollo-alla-cacciatora', 'Pollo alla cacciatora'),
  ('pasta-con-il-cavolfiore', 'Pasta con il cavolfiore'),
  ('mele-al-forno', 'Mele al forno'),
  ('pasta-e-fagioli', 'Pasta e fagioli'),
  ('gnocchi-al-gorgonzola-e-noci', 'Gnocchi al gorgonzola e noci'),
  ('verza-e-salsiccia', 'Verza e salsiccia'),
  ('insalata-di-melograno-e-finocchi', 'Insalata di melograno e finocchi'),
  ('monte-bianco', 'Monte Bianco'),
  ('tortellini-in-brodo', 'Tortellini in brodo'),
  ('baccala-in-umido', 'Baccalà in umido'),
  ('cotechino-con-lenticchie', 'Cotechino con lenticchie'),
  ('insalata-di-rinforzo', 'Insalata di rinforzo'),
  ('tiramisu-al-panettone', 'Tiramisù al panettone')

on conflict (slug) do update set nome = excluded.nome;

-- -----------------------------------------------------------------------------
-- 2. Giorni per evento, solo per contare persone diverse
-- -----------------------------------------------------------------------------
create table if not exists metrics.event_days (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  evento   text not null check (evento in (
    'vis_lista', 'vis_catalogo', 'vis_analitiche', 'vis_impostazioni',
    'vis_ispirazioni', 'vis_scontrino', 'come_si_fa'
  )),
  primary key (user_id, day, evento)
);

create index if not exists event_days_day_idx on metrics.event_days (day, evento);

comment on table metrics.event_days is 'Giorni (ora italiana) in cui un utente ha aperto una sezione o una ricetta. Solo per contare persone diverse. Tenuta 180 giorni, cancellata con l account, mai esposta riga per riga.';

alter table metrics.piatti     enable row level security;
alter table metrics.event_days enable row level security;
revoke all on metrics.piatti, metrics.event_days from public, anon, authenticated;

-- chi legge le metriche non le sporca (come per active_days nella 0025)
delete from metrics.event_days d
using metrics.excluded e
where e.user_id = d.user_id;

create or replace function metrics.segna_giorno(p_evento text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into metrics.event_days (user_id, day, evento)
  select (select auth.uid()), metrics.today(), p_evento
  where (select auth.uid()) is not null
    and not metrics.is_excluded()
  on conflict do nothing;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Ingresso in una sezione
-- -----------------------------------------------------------------------------
create or replace function public.metrics_record_visit(p_sezione text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or metrics.is_excluded() then
    return;
  end if;
  if p_sezione is null or p_sezione not in (
    'lista', 'catalogo', 'analitiche', 'impostazioni', 'ispirazioni', 'scontrino'
  ) then
    return;
  end if;
  if not metrics.consenti('visita', 200) then
    return;
  end if;
  perform metrics.bump('vis_' || p_sezione);
  perform metrics.segna_giorno('vis_' || p_sezione);
end;
$$;

revoke execute on function public.metrics_record_visit(text) from public, anon;
grant execute on function public.metrics_record_visit(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. "Come si fa": apertura di una ricetta
-- -----------------------------------------------------------------------------
create or replace function public.metrics_record_recipe(p_piatto text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or metrics.is_excluded() then
    return;
  end if;
  if not metrics.consenti('ricetta', 60) then
    return;
  end if;
  perform metrics.bump('come_si_fa');
  perform metrics.segna_giorno('come_si_fa');
  -- il piatto solo se è uno dei nostri: qualsiasi altro testo si scarta
  if exists (select 1 from metrics.piatti where slug = p_piatto) then
    perform metrics.bump('piatto_' || p_piatto);
  end if;
end;
$$;

revoke execute on function public.metrics_record_recipe(text) from public, anon;
grant execute on function public.metrics_record_recipe(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Aggregati per il cruscotto
--
-- persone: chi nel periodo ha aperto una sezione o ha fatto un'azione
-- (event_days + active_days). È la base per le quote, per esempio la quota di
-- persone che apre Ispirazioni. Prima della 2.6.0 le visite non arrivavano:
-- nei primi giorni le quote sono basse per questo.
-- -----------------------------------------------------------------------------
create or replace function metrics.utilizzo(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from date := least(p_from, p_to);
  v_to   date := greatest(p_from, p_to);
  v_out  jsonb;
begin
  with
  sezioni(nome, ord) as (
    values ('lista', 1), ('catalogo', 2), ('ispirazioni', 3), ('analitiche', 4),
           ('impostazioni', 5), ('scontrino', 6)
  ),
  ev as (
    select user_id, day, evento from metrics.event_days
    where day between v_from and v_to
  ),
  cnt as (
    select day, metric, n from metrics.daily_counts
    where day between v_from and v_to
      and (metric like 'vis\_%' or metric = 'come_si_fa' or metric like 'piatto\_%')
  ),
  persone as (
    select user_id from ev
    union
    select user_id from metrics.active_days where day between v_from and v_to
  )
  select jsonb_build_object('utilizzo', jsonb_build_object(
    'persone', (select count(*) from persone),
    'persone_sezioni', (select count(distinct user_id) from ev where evento like 'vis\_%'),
    'sezioni', (select jsonb_agg(jsonb_build_object(
                  'nome', s.nome,
                  'visite', coalesce((select sum(n) from cnt where metric = 'vis_' || s.nome), 0),
                  'persone', (select count(distinct user_id) from ev where evento = 'vis_' || s.nome)
                ) order by s.ord) from sezioni s),
    'come_si_fa', jsonb_build_object(
      'aperture', coalesce((select sum(n) from cnt where metric = 'come_si_fa'), 0),
      'persone', (select count(distinct user_id) from ev where evento = 'come_si_fa')
    ),
    -- chi guarda le ricette: apre Ispirazioni o legge un "Come si fa"
    'persone_ricette', (select count(distinct user_id) from ev
                        where evento in ('vis_ispirazioni', 'come_si_fa')),
    'piatti', coalesce((select jsonb_agg(jsonb_build_object('nome', x.nome, 'valore', x.n) order by x.n desc, x.nome)
                from (select p.nome, sum(c.n) as n
                      from cnt c join metrics.piatti p on c.metric = 'piatto_' || p.slug
                      group by p.nome order by 2 desc, 1 limit 15) x), '[]'::jsonb),
    'piatti_letti', (select count(distinct metric) from cnt where metric like 'piatto\_%'),
    'giorni', coalesce((select jsonb_agg(jsonb_build_object(
                  'giorno', g::date,
                  'lista',        coalesce((select sum(n) from cnt where day = g::date and metric = 'vis_lista'), 0),
                  'catalogo',     coalesce((select sum(n) from cnt where day = g::date and metric = 'vis_catalogo'), 0),
                  'ispirazioni',  coalesce((select sum(n) from cnt where day = g::date and metric = 'vis_ispirazioni'), 0),
                  'analitiche',   coalesce((select sum(n) from cnt where day = g::date and metric = 'vis_analitiche'), 0),
                  'impostazioni', coalesce((select sum(n) from cnt where day = g::date and metric = 'vis_impostazioni'), 0),
                  'scontrino',    coalesce((select sum(n) from cnt where day = g::date and metric = 'vis_scontrino'), 0),
                  'come_si_fa',   coalesce((select sum(n) from cnt where day = g::date and metric = 'come_si_fa'), 0),
                  'p_sezioni',    (select count(distinct user_id) from ev where day = g::date and evento like 'vis\_%'),
                  'p_ispirazioni',(select count(distinct user_id) from ev where day = g::date and evento = 'vis_ispirazioni'),
                  'p_come_si_fa', (select count(distinct user_id) from ev where day = g::date and evento = 'come_si_fa')
                ) order by g)
              from generate_series(v_from, v_to, interval '1 day') g), '[]'::jsonb)
  )) into v_out;
  return v_out;
end;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;

-- metrics_app, periodi e istantanea con l'utilizzo (stessi corpi della 0028
-- più metrics.utilizzo; snapshot() non cambia: legge periodo e periodo_corto)
create or replace function public.metrics_app(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or not exists (select 1 from metrics.admins where user_id = (select auth.uid())) then
    raise exception 'Non autorizzato.' using errcode = '42501', hint = 'not_admin';
  end if;
  return metrics.app_data(p_from, p_to) || metrics.extra_data(p_from, p_to)
         || metrics.extra_v4(p_from, p_to) || metrics.utilizzo(p_from, p_to);
end;
$$;

create or replace function metrics.periodo(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select metrics.app_data(p_from, p_to) || metrics.extra_data(p_from, p_to)
         || metrics.extra_v4(p_from, p_to) || metrics.utilizzo(p_from, p_to);
$$;

-- il periodo "prima" serve solo ai confronti: dell'utilizzo restano i totali
create or replace function metrics.periodo_corto(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (x - 'giorni')
         || jsonb_build_object('sessioni', (x -> 'sessioni') - 'giorni',
                               'errori', (x -> 'errori') - 'giorni' - 'frequenti',
                               'utilizzo', (u -> 'utilizzo') - 'giorni' - 'piatti')
  from (select metrics.app_data(p_from, p_to) || metrics.extra_data(p_from, p_to) as x,
               metrics.utilizzo(p_from, p_to) as u) s;
$$;

revoke execute on all functions in schema metrics from public, anon, authenticated;
grant execute on function public.metrics_app(date, date) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Conservazione: event_days solo per 180 giorni, come active_days
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'frigolo-metrics-event-days') then
    perform cron.unschedule('frigolo-metrics-event-days');
  end if;
  perform cron.schedule(
    'frigolo-metrics-event-days',
    '25 2 * * *',
    $job$delete from metrics.event_days where day < (now() at time zone 'Europe/Rome')::date - 180$job$
  );
end;
$$;
