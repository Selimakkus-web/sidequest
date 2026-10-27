-- Başvuru sistemi. 0001 çalıştırıldıktan SONRA çalıştırın.
alter table public.quests add column join_mode text not null default 'open' check (join_mode in ('open','application'));

create table public.quest_applications (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text not null check (char_length(note) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (quest_id, user_id)
);
alter table public.quest_applications enable row level security;
-- Başvuru notunu yalnızca başvuran, görev sahibi ve yönetici görür. Yazma yalnızca fonksiyonlarla.
create policy apps_read on public.quest_applications for select using (
  user_id = auth.uid() or is_admin()
  or exists (select 1 from quests where id = quest_id and creator_id = auth.uid()));

-- Doğrudan katılım artık yalnızca "open" görevlerde
create or replace function public.join_quest(p_quest uuid, p_code text default null) returns void
language plpgsql security definer set search_path = public as $$
declare q quests; n int;
begin
  if auth.uid() is null then raise exception 'oturum_gerekli'; end if;
  select * into q from quests where id = p_quest for update;
  if not found or q.status = 'removed' then raise exception 'gorev_bulunamadi'; end if;
  if q.status <> 'open' then raise exception 'gorev_kapali'; end if;
  if q.join_mode = 'application' and q.creator_id <> auth.uid() then raise exception 'basvuru_gerekli'; end if;
  if q.visibility = 'private' and q.creator_id <> auth.uid()
     and not exists (select 1 from quest_invites where quest_id = p_quest and code = p_code) then raise exception 'davet_gerekli'; end if;
  select count(*) into n from quest_members where quest_id = p_quest and status <> 'left';
  if q.max_participants is not null and n >= q.max_participants then raise exception 'gorev_dolu'; end if;
  insert into quest_members (quest_id, user_id) values (p_quest, auth.uid())
  on conflict (quest_id, user_id) do update set status = 'active', joined_at = now() where quest_members.status = 'left';
end $$;

create function public.apply_to_quest(p_quest uuid, p_note text, p_code text default null) returns void
language plpgsql security definer set search_path = public as $$
declare q quests; a quest_applications;
begin
  if auth.uid() is null then raise exception 'oturum_gerekli'; end if;
  select * into q from quests where id = p_quest;
  if not found or q.status = 'removed' then raise exception 'gorev_bulunamadi'; end if;
  if q.status <> 'open' then raise exception 'gorev_kapali'; end if;
  if q.join_mode <> 'application' then raise exception 'basvuru_gerekmiyor'; end if;
  if q.visibility = 'private' and not exists (select 1 from quest_invites where quest_id = p_quest and code = p_code) then raise exception 'davet_gerekli'; end if;
  if exists (select 1 from quest_members where quest_id = p_quest and user_id = auth.uid() and status <> 'left') then raise exception 'zaten_uye'; end if;
  select * into a from quest_applications where quest_id = p_quest and user_id = auth.uid();
  if found then
    if a.status in ('pending','approved') then raise exception 'basvuru_var'; end if;
    if a.status = 'rejected' then raise exception 'basvuru_reddedildi'; end if;
    update quest_applications set note = p_note, status = 'pending', created_at = now(), decided_at = null where id = a.id;
  else
    insert into quest_applications (quest_id, user_id, note) values (p_quest, auth.uid(), p_note);
  end if;
  insert into notifications (recipient_id, type, payload) values (q.creator_id, 'basvuru_geldi', jsonb_build_object('quest_id', p_quest, 'applicant_id', auth.uid()));
end $$;

create function public.decide_application(p_app uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare a quest_applications; q quests; n int;
begin
  select * into a from quest_applications where id = p_app for update;
  if not found then raise exception 'gorev_bulunamadi'; end if;
  select * into q from quests where id = a.quest_id;
  if q.creator_id <> auth.uid() then raise exception 'yetkisiz'; end if;
  if a.status <> 'pending' then raise exception 'basvuru_karar_verilmis'; end if;
  if p_approve then
    select count(*) into n from quest_members where quest_id = q.id and status <> 'left';
    if q.max_participants is not null and n >= q.max_participants then raise exception 'gorev_dolu'; end if;
    insert into quest_members (quest_id, user_id) values (q.id, a.user_id)
    on conflict (quest_id, user_id) do update set status = 'active', joined_at = now();
  end if;
  update quest_applications set status = case when p_approve then 'approved' else 'rejected' end, decided_at = now() where id = p_app;
  insert into notifications (recipient_id, type, payload)
  values (a.user_id, case when p_approve then 'basvuru_onaylandi' else 'basvuru_reddedildi' end, jsonb_build_object('quest_id', q.id));
end $$;
