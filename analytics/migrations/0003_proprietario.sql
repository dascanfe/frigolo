-- =============================================================================
-- Analitiche di dascanfe.com - 0003: accesso legato all'account, non all'email
--
-- Perché (giro di Aglio, ottobre 2026): le policy confrontavano l'email del JWT.
-- Ora valgono per gli account elencati in public.proprietari (per user_id),
-- riempita una volta dagli account che avevano l'email autorizzata.
-- Inoltre le viste v_oggi e v_sezioni leggono con i permessi di chi le
-- interroga (security_invoker), quindi seguono le stesse regole delle tabelle.
-- Idempotente.
-- =============================================================================

create table if not exists public.proprietari (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.proprietari enable row level security;
revoke all on public.proprietari from anon, authenticated;

create or replace function public.e_proprietario()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.proprietari where user_id = (select auth.uid()))
$$;
revoke all on function public.e_proprietario() from public, anon;
grant execute on function public.e_proprietario() to authenticated;

do $$
declare
  r record;
  mail text;
begin
  for r in
    select schemaname, tablename, policyname, cmd, qual
    from pg_policies
    where schemaname = 'public' and qual like '%auth.jwt()%email%'
  loop
    mail := substring(r.qual from '''([^'']+@[^'']+)''');
    if mail is not null then
      insert into public.proprietari (user_id)
      select id from auth.users where lower(email) = lower(mail)
      on conflict do nothing;
    end if;
    if r.cmd = 'SELECT' then
      execute format('alter policy %I on %I.%I using (public.e_proprietario())',
        r.policyname, r.schemaname, r.tablename);
    else
      execute format('alter policy %I on %I.%I using (public.e_proprietario()) with check (public.e_proprietario())',
        r.policyname, r.schemaname, r.tablename);
    end if;
  end loop;
end $$;

alter view if exists public.v_oggi set (security_invoker = true);
alter view if exists public.v_sezioni set (security_invoker = true);

select
  (select count(*) from public.proprietari) as proprietari,
  (select count(*) from pg_policies where schemaname = 'public' and qual like '%auth.jwt()%') as policy_con_email,
  (select count(*) from pg_class where relname in ('v_oggi', 'v_sezioni') and reloptions::text like '%security_invoker=true%') as viste_invoker;
