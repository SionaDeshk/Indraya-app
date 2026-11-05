create extension if not exists postgis with schema extensions;
create table public.profiles(id uuid primary key references auth.users on delete cascade, display_name text not null check(length(display_name) between 1 and 60), created_at timestamptz not null default now());
create table public.moderators(user_id uuid primary key references auth.users on delete cascade);
alter table public.moderators enable row level security;
create function public.is_moderator() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from moderators where user_id=auth.uid()) $$;
create table public.observations(
 id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users,
 category text not null check(category in ('Safety','Outdoors','Travel')), title text not null check(length(trim(title)) between 5 and 100), description text not null check(length(trim(description)) between 10 and 2000),
 latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
 location extensions.geography(Point,4326) generated always as (extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography) stored,
 status text not null default 'published' check(status in ('published','hidden','review')),
 verification text not null default 'unverified' check(verification in ('unverified','reviewed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index observations_location_idx on public.observations using gist(location);
create index observations_author_time on public.observations(author_id,created_at);
create function public.guard_observation() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' then
   perform pg_advisory_xact_lock(hashtext(new.author_id::text));
   if (select count(*) from observations where author_id=new.author_id and created_at>now()-interval '1 hour') >= 5 then raise exception 'Limit of five observations per hour'; end if;
   new.status:='published';new.verification:='unverified';new.created_at:=now();
 elsif not is_moderator() then
   if old.status<>'published' or new.status<>old.status or new.verification<>old.verification or new.author_id<>old.author_id or new.created_at<>old.created_at or new.id<>old.id then raise exception 'Protected moderation fields';end if;
   new.verification:='unverified';
 end if;
 new.latitude:=round(new.latitude::numeric,2);new.longitude:=round(new.longitude::numeric,2);new.updated_at:=now();return new;
end $$;
create trigger guard_observation before insert or update on public.observations for each row execute function public.guard_observation();
create table public.observation_media(id uuid primary key default gen_random_uuid(),observation_id uuid not null references observations on delete cascade,storage_path text not null unique,created_at timestamptz not null default now());
create table public.report_flags(id uuid primary key default gen_random_uuid(),observation_id uuid not null references observations,reporter_id uuid not null references auth.users,reason text not null check(reason in ('misleading','dangerous','abusive')),created_at timestamptz not null default now(),unique(observation_id,reporter_id));
create table public.moderation_actions(id uuid primary key default gen_random_uuid(),observation_id uuid not null references observations,moderator_id uuid not null references auth.users,action text not null check(action in ('approve','hide','review')),reason text not null,created_at timestamptz not null default now());
create table public.official_sources(id uuid primary key default gen_random_uuid(),name text not null,url text not null,terms_url text not null,validated_at timestamptz,enabled boolean not null default false,created_at timestamptz not null default now());
create table public.official_alerts(id uuid primary key default gen_random_uuid(),source_id uuid not null references official_sources,external_id text not null,title text not null,body text not null,source_url text not null,observed_at timestamptz not null,expires_at timestamptz,location extensions.geography(Geometry,4326),created_at timestamptz not null default now(),unique(source_id,external_id));
create index official_alerts_location_idx on public.official_alerts using gist(location);
alter table profiles enable row level security;
alter table observations enable row level security;
alter table observation_media enable row level security;
alter table report_flags enable row level security;
alter table moderation_actions enable row level security;
alter table official_sources enable row level security;
alter table official_alerts enable row level security;
create policy profile_self on profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
-- Column grants keep reporter identity off the public API, including when rows are visible.
revoke all on observations from anon,authenticated;
grant select(id,category,title,description,latitude,longitude,status,verification,created_at,updated_at) on observations to anon,authenticated;
grant insert(author_id,category,title,description,latitude,longitude) on observations to authenticated;
grant update(category,title,description,latitude,longitude) on observations to authenticated;
create policy observation_read on observations for select using(status='published' or author_id=auth.uid() or is_moderator());
create policy observation_create on observations for insert to authenticated with check(author_id=auth.uid());
create policy observation_edit on observations for update to authenticated using(author_id=auth.uid() and status='published') with check(author_id=auth.uid());
create policy media_read on observation_media for select using(exists(select 1 from observations o where o.id=observation_id and o.status='published'));
-- No client media writes until the privacy-reviewed upload pipeline exists.
create policy flag_create on report_flags for insert to authenticated with check(reporter_id=auth.uid());
create policy flag_read on report_flags for select to authenticated using(reporter_id=auth.uid() or is_moderator());
create policy action_read on moderation_actions for select to authenticated using(is_moderator());
create policy source_read on official_sources for select using(enabled and validated_at is not null);
create policy alert_read on official_alerts for select using(exists(select 1 from official_sources s where s.id=source_id and s.enabled and s.validated_at is not null));
create function public.moderate_report(report uuid,decision text,explanation text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_moderator() then raise exception 'Moderator required';end if;
 if decision not in ('approve','hide','review') or length(trim(explanation))<5 then raise exception 'Decision and reason required';end if;
 update observations set status=case decision when 'approve' then 'published' when 'hide' then 'hidden' else 'review' end,verification=case decision when 'approve' then 'reviewed' else 'unverified' end where id=report;
 if not found then raise exception 'Report not found';end if;
 insert into moderation_actions(observation_id,moderator_id,action,reason) values(report,auth.uid(),decision,explanation);
end $$;
revoke all on function public.moderate_report(uuid,text,text) from public;
grant execute on function public.moderate_report(uuid,text,text) to authenticated;
insert into storage.buckets(id,name,public) values('observation-media','observation-media',false) on conflict do nothing;
-- Private storage, no client upload/read policies until photo moderation is implemented.
create function public.guard_flag() returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtext('flag:'||new.reporter_id::text));
 if (select count(*) from report_flags where reporter_id=new.reporter_id and created_at>now()-interval '1 hour')>=20 then raise exception 'Flag rate limit reached';end if;
 new.created_at:=now();return new;
end $$;
create trigger guard_flag before insert on report_flags for each row execute function public.guard_flag();
create function public.review_queue() returns table(id uuid,title text,status text) language plpgsql security definer set search_path=public as $$
begin
 if not is_moderator() then raise exception 'Moderator required';end if;
 return query select o.id,o.title,o.status from observations o order by o.created_at desc limit 100;
end $$;
revoke all on function public.review_queue() from public;
grant execute on function public.review_queue() to authenticated;
