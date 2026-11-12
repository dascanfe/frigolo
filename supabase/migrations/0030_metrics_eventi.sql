-- 0030: due gesti in più nell'elenco chiuso di metrics_record_event.
-- Stessa funzione della 0028, cambia solo l'elenco.

create or replace function public.metrics_record_event(p_evento text)
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
  if p_evento not in (
    'ricerca_vuota',
    'install_scheda', 'install_android_tocco', 'install_prompt_accettato',
    'install_prompt_rifiutato', 'install_guida_ios',
    'aggiorna_barra', 'aggiorna_tocco',
    'sostegno_1', 'sostegno_2'
  ) then
    return;
  end if;
  if not metrics.consenti('evento', 60) then
    return;
  end if;
  perform metrics.bump('ev_' || p_evento);
end;
$$;


revoke execute on function public.metrics_record_event(text) from public, anon;
grant execute on function public.metrics_record_event(text) to authenticated;
