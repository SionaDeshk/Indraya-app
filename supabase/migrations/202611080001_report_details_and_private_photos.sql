alter table public.observations add column kind text;
update public.observations set kind=case category when 'Outdoors' then 'wildlife' when 'Travel' then 'road' else 'hazard' end;
alter table public.observations alter column kind set not null;
alter table public.observations add column place_name text not null default 'Approximate map location' check(length(trim(place_name)) between 1 and 160);
alter table public.observations add column observed_at timestamptz;
update public.observations set observed_at=created_at;
alter table public.observations alter column observed_at set default now();
alter table public.observations alter column observed_at set not null;
alter table public.observations add column details jsonb not null default '{}'::jsonb;
create function public.validate_observation_details() returns trigger language plpgsql set search_path=public as $$
begin
 if new.kind is null then new.kind:=case new.category when 'Outdoors' then 'wildlife' when 'Travel' then 'road' else 'hazard' end;end if;
 if not ((new.category='Safety' and new.kind in ('hazard','smoke','flooding')) or (new.category='Outdoors' and new.kind in ('wildlife','trail','aurora')) or (new.category='Travel' and new.kind='road')) then raise exception 'Report type does not match category';end if;
 if tg_op='INSERT' or new.observed_at is distinct from old.observed_at then
  if new.observed_at>now()+interval '1 minute' or new.observed_at<now()-interval '30 days' then raise exception 'Observation time must be within the last 30 days';end if;
 end if;
 if jsonb_typeof(new.details)<>'object' or octet_length(new.details::text)>2000 then raise exception 'Invalid report details';end if;
 if exists(select 1 from jsonb_object_keys(new.details) k where k not in ('animal','count','surface','visibility')) then raise exception 'Unsupported report detail';end if;
 if (new.details ? 'animal' or new.details ? 'count') and new.kind<>'wildlife' then raise exception 'Animal details require wildlife type';end if;
 if (new.details ? 'surface' or new.details ? 'visibility') and new.kind<>'road' then raise exception 'Road details require road type';end if;
 if new.details ? 'animal' and (jsonb_typeof(new.details->'animal')<>'string' or length(new.details->>'animal')>80) then raise exception 'Invalid animal name';end if;
 if new.details ? 'count' then
  if jsonb_typeof(new.details->'count')<>'number' then raise exception 'Invalid animal count';end if;
  if (new.details->>'count')::numeric<1 or (new.details->>'count')::numeric>10000 or trunc((new.details->>'count')::numeric)<>(new.details->>'count')::numeric then raise exception 'Invalid animal count';end if;
 end if;
 if new.details ? 'surface' and (jsonb_typeof(new.details->'surface')<>'string' or new.details->>'surface' not in ('Unknown','Dry','Wet','Snow','Ice')) then raise exception 'Invalid road surface';end if;
 if new.details ? 'visibility' and (jsonb_typeof(new.details->'visibility')<>'string' or new.details->>'visibility' not in ('Unknown','Good','Reduced','Very poor')) then raise exception 'Invalid visibility';end if;
 return new;
end $$;
create trigger validate_observation_details before insert or update on public.observations for each row execute function public.validate_observation_details();
grant select(kind,place_name,observed_at,details) on public.observations to anon,authenticated;
grant insert(kind,place_name,observed_at,details) on public.observations to authenticated;
grant update(kind,place_name,observed_at,details) on public.observations to authenticated;
create index observations_observed_at_idx on public.observations(observed_at desc);
alter table public.observation_media add column status text not null default 'pending' check(status in ('pending','approved','hidden'));
create unique index observation_media_one_photo on public.observation_media(observation_id);
create function public.owns_observation(report uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from observations where id=report and author_id=auth.uid()) $$;
drop policy media_read on public.observation_media;
create policy media_read on public.observation_media for select using(
 owns_observation(observation_id) or is_moderator() or (status='approved' and exists(select 1 from observations o where o.id=observation_id and o.status='published'))
);
-- No client storage or media metadata write policies. The authenticated Edge Function sanitizes uploads.
update storage.buckets set public=false,file_size_limit=2097152,allowed_mime_types=array['image/jpeg'] where id='observation-media';
create function public.moderate_media(media uuid,decision text,explanation text) returns void language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
 if not is_moderator() then raise exception 'Moderator required';end if;
 if decision not in ('approve','hide') or length(trim(explanation))<5 then raise exception 'Decision and reason required';end if;
 update observation_media set status=case decision when 'approve' then 'approved' else 'hidden' end where id=media returning observation_id into target;
 if not found then raise exception 'Photo not found';end if;
 insert into moderation_actions(observation_id,moderator_id,action,reason) values(target,auth.uid(),decision,'Photo review: '||explanation);
end $$;
revoke all on function public.moderate_media(uuid,text,text) from public;
grant execute on function public.moderate_media(uuid,text,text) to authenticated;
-- Even projects with broad pre-existing Storage policies cannot bypass the sanitizing handler.
create policy indraya_private_media on storage.objects as restrictive for all to anon,authenticated
 using(bucket_id<>'observation-media') with check(bucket_id<>'observation-media');

create function public.observations_in_bounds(west double precision,south double precision,east double precision,north double precision) returns table(id uuid,category text,kind text,title text,description text,latitude double precision,longitude double precision,place_name text,observed_at timestamptz,details jsonb,created_at timestamptz,verification text) language plpgsql stable security definer set search_path=public as $$
begin
 if west is null or east is null or north is null or south is null or west not between -180 and 180 or east not between -180 and 180 or south not between -90 and 90 or north not between -90 and 90 or south>north then raise exception 'Invalid map bounds';end if;
 if west<=east and east-west<180 and west<east and south<north then
  return query select o.id,o.category,o.kind,o.title,o.description,o.latitude,o.longitude,o.place_name,o.observed_at,o.details,o.created_at,o.verification from observations o where o.status='published' and o.longitude between west and east and o.latitude between south and north and o.location OPERATOR(extensions.&&) (extensions.st_makeenvelope(west,south,east,north,4326)::extensions.geography) order by o.observed_at desc limit 300;
 else
  return query select o.id,o.category,o.kind,o.title,o.description,o.latitude,o.longitude,o.place_name,o.observed_at,o.details,o.created_at,o.verification from observations o where o.status='published' and o.latitude between south and north and ((west<=east and o.longitude between west and east) or (west>east and (o.longitude>=west or o.longitude<=east))) order by o.observed_at desc limit 300;
 end if;
end $$;
revoke all on function public.observations_in_bounds(double precision,double precision,double precision,double precision) from public;
grant execute on function public.observations_in_bounds(double precision,double precision,double precision,double precision) to anon,authenticated;
