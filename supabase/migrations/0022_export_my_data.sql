-- =============================================================================
-- Frigolo - 0022: export dei dati dell'utente (issue #9, GDPR art. 15 e 20)
--
-- Perché: chi usa Frigolo deve poter scaricare i propri dati in un formato
-- leggibile da una macchina. export_my_data() restituisce un JSON con:
--   - account: email e date (da auth.users, solo i propri);
--   - profilo: nome, colore, percorso della foto;
--   - per ogni lista di cui fa parte: nome, supermercati, quando è entrato,
--     prodotti in lista, prodotti creati nella lista, spese e prodotti
--     comprati.
-- Le liste sono condivise: l'export contiene anche quello che hanno aggiunto
-- le altre persone, ma senza i loro identificativi né i loro nomi. Per ogni
-- riga c'è solo "da_me" (true se l'hai aggiunta o comprata tu).
-- Niente codici d'invito: sono segreti della lista, non dati personali.
--
-- security invoker: la RLS limita già tutto alle liste dell'utente; l'unica
-- lettura fuori dalla RLS è la propria riga di auth.users, fatta da una
-- funzione definer separata che legge solo auth.uid().
-- La cancellazione dell'account è nella edge function delete-account.
-- =============================================================================

create or replace function public.my_account_info()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'email', u.email,
    'creato_il', u.created_at,
    'email_confermata_il', u.email_confirmed_at,
    'ultimo_accesso', u.last_sign_in_at
  )
  from auth.users u
  where u.id = (select auth.uid());
$$;

-- eseguibile dagli autenticati perché export_my_data è invoker; restituisce
-- solo la riga del chiamante
revoke execute on function public.my_account_info() from public, anon;
grant execute on function public.my_account_info() to authenticated;

create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Non autenticato.' using errcode = '42501', hint = 'not_authenticated';
  end if;

  return jsonb_build_object(
    'formato', 'frigolo-export-1',
    'esportato_il', now(),
    'account', public.my_account_info(),
    'profilo', (
      select jsonb_build_object(
        'nome', p.display_name,
        'colore', p.color,
        'foto', p.avatar_path,
        'creato_il', p.created_at,
        'aggiornato_il', p.updated_at
      )
      from public.profiles p
      where p.id = v_user
    ),
    'liste', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', h.name,
        'creata_il', h.created_at,
        'entrato_il', m.joined_at,
        'persone', (select count(*) from public.household_members x where x.household_id = h.id),
        'supermercati', to_jsonb(h.stores),
        'in_lista', coalesce((
          select jsonb_agg(jsonb_build_object(
            'prodotto', i.name,
            'stato', case e.status when 'cart' then 'nel carrello' else 'da comprare' end,
            'quantita', e.quantity,
            'unita', e.unit,
            'nota', e.note,
            'supermercato', e.store,
            'aggiunto_il', e.added_at,
            'da_me', e.added_by = v_user
          ) order by e.added_at)
          from public.list_entries e
          join public.items i on i.id = e.item_id
          where e.household_id = h.id
        ), '[]'::jsonb),
        'prodotti_della_lista', coalesce((
          select jsonb_agg(jsonb_build_object(
            'nome', i.name,
            'categoria', c.name,
            'unita', i.default_unit,
            'archiviato', i.is_archived,
            'creato_il', i.created_at,
            'da_me', i.created_by = v_user
          ) order by i.name)
          from public.items i
          join public.categories c on c.id = i.category_id
          where i.household_id = h.id
        ), '[]'::jsonb),
        'spese', coalesce((
          select jsonb_agg(jsonb_build_object(
            'supermercato', t.store,
            'iniziata_il', t.started_at,
            'finita_il', t.completed_at,
            'da_me', t.completed_by = v_user,
            'prodotti', coalesce((
              select jsonb_agg(jsonb_build_object(
                'prodotto', i.name,
                'categoria', c.name,
                'quantita', pu.quantity,
                'unita', pu.unit,
                'comprato_il', pu.purchased_at,
                'aggiunto_da_me', pu.added_by = v_user
              ) order by pu.purchased_at)
              from public.purchases pu
              join public.items i on i.id = pu.item_id
              join public.categories c on c.id = pu.category_id
              where pu.trip_id = t.id
            ), '[]'::jsonb)
          ) order by t.started_at)
          from public.shopping_trips t
          where t.household_id = h.id
        ), '[]'::jsonb)
      ) order by m.joined_at)
      from public.household_members m
      join public.households h on h.id = m.household_id
      where m.user_id = v_user
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
