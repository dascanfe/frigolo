-- =============================================================================
-- Frigolo - 0027: rifiniture di sicurezza dal giro post-lancio di Aglio
--
-- Nota su pg_net: i permessi predefiniti di anon e authenticated sullo schema
-- net non si possono revocare da qui (gli oggetti appartengono a
-- supabase_admin). Lo schema non è esposto dalle API e pg_graphql è spento,
-- quindi non sono raggiungibili dai client.
--
-- metrics_record_error: al massimo 300 messaggi diversi al giorno; oltre,
--    si contano solo quelli già visti. Evita che qualcuno riempia il cruscotto
--    di testi nuovi.
-- Idempotente.
-- =============================================================================

create or replace function public.metrics_record_error(
  p_tipo      text,
  p_messaggio text,
  p_versione  text,
  p_pagina    text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_tipo      text := case when p_tipo in ('errore', 'promessa', 'query', 'modifica') then p_tipo else 'altro' end;
  v_messaggio text := coalesce(nullif(metrics.ripulisci(p_messaggio, 200), ''), '(senza messaggio)');
  v_versione  text := case when p_versione ~ '^[0-9]{1,3}(\.[0-9]{1,3}){0,3}$' then p_versione else 'altro' end;
  v_pagina    text := metrics.ripulisci_pagina(p_pagina);
begin
  if (select auth.uid()) is null or metrics.is_excluded() then
    return;
  end if;
  if not metrics.consenti('errore', 20) then
    return;
  end if;

  update metrics.error_counts c set n = c.n + 1
  where c.day = metrics.today() and c.tipo = v_tipo and c.messaggio = v_messaggio
    and c.versione = v_versione and c.pagina = v_pagina;
  if found then
    return;
  end if;

  -- tetto giornaliero di messaggi diversi
  if (select count(*) from metrics.error_counts where day = metrics.today()) >= 300 then
    return;
  end if;

  insert into metrics.error_counts as c (day, tipo, messaggio, versione, pagina, n)
  values (metrics.today(), v_tipo, v_messaggio, v_versione, v_pagina, 1)
  on conflict (day, tipo, messaggio, versione, pagina) do update set n = c.n + 1;
end;
$$;
revoke execute on function public.metrics_record_error(text, text, text, text) from public, anon;
grant execute on function public.metrics_record_error(text, text, text, text) to authenticated;
