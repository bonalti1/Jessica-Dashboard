-- SLP Caseload Notebook — Supabase schema.
-- Run once in the Supabase SQL editor (or via the Management API).
-- One JSON document per signed-in user, with an optimistic-concurrency revision.

create table if not exists public.notebook (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  revision   integer not null check (revision > 0),
  document   jsonb   not null,
  updated_at timestamptz not null default now()
);

alter table public.notebook enable row level security;

drop policy if exists "notebook_select_own" on public.notebook;
drop policy if exists "notebook_insert_own" on public.notebook;
drop policy if exists "notebook_update_own" on public.notebook;
create policy "notebook_select_own" on public.notebook for select to authenticated using (user_id = auth.uid());
create policy "notebook_insert_own" on public.notebook for insert to authenticated with check (user_id = auth.uid());
create policy "notebook_update_own" on public.notebook for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Atomic save: returns the new revision, or -1 when a newer version already exists.
create or replace function public.save_notebook(p_revision integer, p_document jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  next_rev integer := p_revision + 1;
  changed integer;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_revision = 0 then
    insert into public.notebook (user_id, revision, document)
    values (uid, next_rev, p_document)
    on conflict (user_id) do nothing;
  else
    update public.notebook
       set revision = next_rev, document = p_document, updated_at = now()
     where user_id = uid and revision = p_revision;
  end if;
  get diagnostics changed = row_count;
  if changed = 1 then
    return next_rev;
  end if;
  -- Idempotent retry of a save that already landed.
  if exists (select 1 from public.notebook where user_id = uid and revision = next_rev and document = p_document) then
    return next_rev;
  end if;
  return -1;
end;
$$;

revoke all on function public.save_notebook(integer, jsonb) from public, anon;
grant execute on function public.save_notebook(integer, jsonb) to authenticated;
