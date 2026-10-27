-- SideQuest ilk şema. Supabase SQL Editor'da veya `supabase db push` ile çalıştırın.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text check (char_length(bio) <= 280),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Yöneticiler ayrı tabloda; istemci politikası yok, yalnızca SQL ile eklenir.
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) <= 4000),
  category text not null,
  visibility text not null default 'public' check (visibility in ('public','private')),
  status text not null default 'open' check (status in ('open','closed','removed')),
  deadline timestamptz,
  max_participants int check (max_participants > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quests_public_idx on public.quests (visibility, status, created_at desc);
create table public.quest_invites (quest_id uuid primary key references public.quests(id) on delete cascade, code text not null unique default encode(gen_random_bytes(9),'hex'));

create table public.quest_members (
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','left')),
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (quest_id, user_id)
);
create table public.quest_milestones (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  position int not null, created_at timestamptz not null default now(),
  unique (quest_id, position)
);
create table public.milestone_completions (
  milestone_id uuid not null references public.quest_milestones(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (milestone_id, user_id)
);
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text not null check (char_length(note) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index check_ins_quest_idx on public.check_ins (quest_id, created_at desc);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, payload jsonb not null default '{}',
  read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('quest','comment')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 500),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

-- Yardımcı fonksiyonlar (RLS özyinelemesini önlemek için security definer)
create function public.is_admin() returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from admins where user_id = auth.uid()) $$;
create function public.is_member(q uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from quest_members where quest_id = q and user_id = auth.uid() and status <> 'left') $$;
create function public.can_view_quest(q uuid) returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from quests where id = q and (
  (visibility = 'public' and status <> 'removed') or creator_id = auth.uid() or public.is_member(q) or public.is_admin())) $$;

-- Yeni kullanıcı için profil
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, display_name)
  values (new.id, lower(new.raw_user_meta_data->>'username'), coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Katılma: kapasite, durum, gizlilik ve davet kodu sunucuda denetlenir
create function public.join_quest(p_quest uuid, p_code text default null) returns void
language plpgsql security definer set search_path = public as $$
declare q quests; n int;
begin
  if auth.uid() is null then raise exception 'oturum_gerekli'; end if;
  select * into q from quests where id = p_quest for update;
  if not found or q.status = 'removed' then raise exception 'gorev_bulunamadi'; end if;
  if q.status <> 'open' then raise exception 'gorev_kapali'; end if;
  if q.visibility = 'private' and q.creator_id <> auth.uid()
     and not exists (select 1 from quest_invites where quest_id = p_quest and code = p_code) then raise exception 'davet_gerekli'; end if;
  select count(*) into n from quest_members where quest_id = p_quest and status <> 'left';
  if q.max_participants is not null and n >= q.max_participants then raise exception 'gorev_dolu'; end if;
  insert into quest_members (quest_id, user_id) values (p_quest, auth.uid())
  on conflict (quest_id, user_id) do update set status = 'active', joined_at = now() where quest_members.status = 'left';
end $$;
create function public.complete_quest(p_quest uuid) returns void
language sql security definer set search_path = public as $$
  update quest_members set status = 'completed', completed_at = now()
  where quest_id = p_quest and user_id = auth.uid() and status = 'active' $$;
create function public.leave_quest(p_quest uuid) returns void
language sql security definer set search_path = public as $$
  update quest_members set status = 'left' where quest_id = p_quest and user_id = auth.uid() and status = 'active' $$;

-- RLS
alter table profiles enable row level security;       alter table admins enable row level security;
alter table quests enable row level security;         alter table quest_invites enable row level security;
alter table quest_members enable row level security;  alter table quest_milestones enable row level security;
alter table milestone_completions enable row level security; alter table check_ins enable row level security;
alter table comments enable row level security;       alter table notifications enable row level security;
alter table reports enable row level security;

create policy profiles_read on profiles for select using (true);
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy quests_read on quests for select using (can_view_quest(id));
create policy quests_insert on quests for insert to authenticated with check (creator_id = auth.uid());
create policy quests_update on quests for update using (creator_id = auth.uid() or is_admin()) with check (creator_id = auth.uid() or is_admin());
create policy quests_delete on quests for delete using (creator_id = auth.uid());

create policy invites_creator on quest_invites for select using (exists (select 1 from quests where id = quest_id and creator_id = auth.uid()));
create policy invites_insert on quest_invites for insert with check (exists (select 1 from quests where id = quest_id and creator_id = auth.uid()));

create policy members_read on quest_members for select using (can_view_quest(quest_id));  -- yazma yalnızca join/leave/complete fonksiyonlarıyla

create policy milestones_read on quest_milestones for select using (can_view_quest(quest_id));
create policy milestones_write on quest_milestones for all using (exists (select 1 from quests where id = quest_id and creator_id = auth.uid()))
  with check (exists (select 1 from quests where id = quest_id and creator_id = auth.uid()));

create policy mc_read on milestone_completions for select using (exists (select 1 from quest_milestones m where m.id = milestone_id and can_view_quest(m.quest_id)));
create policy mc_insert on milestone_completions for insert with check (user_id = auth.uid() and exists (select 1 from quest_milestones m where m.id = milestone_id and is_member(m.quest_id)));
create policy mc_delete on milestone_completions for delete using (user_id = auth.uid());

create policy checkins_read on check_ins for select using (can_view_quest(quest_id));
create policy checkins_insert on check_ins for insert with check (user_id = auth.uid() and is_member(quest_id));
create policy checkins_delete on check_ins for delete using (user_id = auth.uid() or is_admin());

create policy comments_read on comments for select using (can_view_quest(quest_id));
create policy comments_insert on comments for insert with check (user_id = auth.uid() and can_view_quest(quest_id));
create policy comments_update on comments for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy comments_delete on comments for delete using (user_id = auth.uid() or is_admin());

create policy notif_read on notifications for select using (recipient_id = auth.uid());
create policy notif_update on notifications for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy reports_insert on reports for insert with check (reporter_id = auth.uid());
create policy reports_read on reports for select using (reporter_id = auth.uid() or is_admin());
create policy reports_update on reports for update using (is_admin()) with check (is_admin());
