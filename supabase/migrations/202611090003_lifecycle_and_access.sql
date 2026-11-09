-- Pending production review: optional notes, server-owned expiry, extent validation and private responses/places.
alter table public.observations drop constraint observations_description_check;
alter table public.observations add constraint observations_description_check check(length(description)<=2000);
alter table public.observations add column expires_at timestamptz;
alter table public.observations add column extent jsonb;
create function public.observation_lifetime(version_id integer,type_id text) returns interval language sql stable security definer set search_path=public as $$
 select make_interval(hours=>coalesce((select (definition->>'ttlHours')::integer from observation_catalog_types where version=version_id and id=type_id),24))
$$;
-- No backfill may change historical privacy, status, text or timestamps.
do $$ begin
 alter table observations disable trigger user;
 update observations set expires_at=observed_at+observation_lifetime(taxonomy_version,event_type_id);
 alter table observations enable trigger user;
end $$;
alter table observations alter column expires_at set not null;
create function public.prepare_observation_lifecycle() returns trigger language plpgsql security definer set search_path=public as $$
declare mode text;points jsonb;point jsonb;clean jsonb:='[]'::jsonb;x numeric;y numeric;n integer;allowed jsonb;
begin
 new.expires_at:=new.observed_at+observation_lifetime(new.taxonomy_version,new.event_type_id);
 if new.privacy_class<>'approximate' then new.extent:=null;end if;
 if new.extent is null then return new;end if;
 if octet_length(new.extent::text)>4000 or jsonb_typeof(new.extent)<>'object' then raise exception 'Invalid observed extent';end if;
 mode:=case new.extent->>'type' when 'LineString' then 'line' when 'Polygon' then 'area' else null end;
 select definition->'extentModes' into allowed from observation_catalog_types where version=new.taxonomy_version and id=new.event_type_id;
 if mode is null or not coalesce(allowed ? mode,false) then raise exception 'This observation uses one spot only';end if;
 points:=case mode when 'line' then new.extent->'coordinates' else new.extent->'coordinates'->0 end;
 if jsonb_typeof(points)<>'array' then raise exception 'Invalid extent points';end if;
 n:=jsonb_array_length(points);if n<(case mode when 'line' then 2 else 4 end) or n>(case mode when 'line' then 16 else 17 end) then raise exception 'Extent needs 2 to 16 points';end if;
 for point in select * from jsonb_array_elements(points) loop
  if jsonb_typeof(point)<>'array' or jsonb_array_length(point)<>2 or jsonb_typeof(point->0)<>'number' or jsonb_typeof(point->1)<>'number' then raise exception 'Invalid extent coordinates';end if;
  x:=(point->>0)::numeric;y:=(point->>1)::numeric;
  if x not between -180 and 180 or y not between -90 and 90 or abs(x-new.longitude)>0.5 or abs(y-new.latitude)>0.5 then raise exception 'Keep the extent near the observed place';end if;
  clean:=clean||jsonb_build_array(jsonb_build_array(round(x,2),round(y,2)));
 end loop;
 if (select count(distinct p) from jsonb_array_elements(clean) p)<(case mode when 'line' then 2 else 3 end) then raise exception 'Extent needs distinct points';end if;
 if mode='area' and clean->0 is distinct from clean->(n-1) then raise exception 'Close the observed area';end if;
 new.extent:=jsonb_build_object('context',case new.event_type_id when 'collision' then 'traffic_backup' else 'observed_conditions' end,'type',new.extent->>'type','coordinates',case mode when 'line' then clean else jsonb_build_array(clean) end);
 if mode='area' and not extensions.st_isvalid(extensions.st_geomfromgeojson(new.extent::text)) then raise exception 'Area must not cross itself';end if;
 return new;
end $$;
create trigger ab_prepare_lifecycle before insert or update on observations for each row execute function prepare_observation_lifecycle();
alter table observations add column extent_geometry extensions.geometry(Geometry,4326) generated always as (extensions.st_geomfromgeojson(extent::text)) stored;
create index observations_extent_idx on observations using gist(extent_geometry);
create index observations_expiry_idx on observations(expires_at);
grant select(expires_at,extent) on observations to anon,authenticated;
grant insert(extent),update(extent) on observations to authenticated;
create table public.observation_responses(
 observation_id uuid not null references observations on delete cascade,
 user_id uuid not null references auth.users on delete cascade,
 response text not null check(response in ('observed','changed','not_observed')),
 observed_at timestamptz not null,
 recorded_at timestamptz not null default clock_timestamp(),
 primary key(observation_id,user_id)
);
alter table observation_responses enable row level security;
create policy response_owner_read on observation_responses for select to authenticated using(user_id=auth.uid());
revoke all on observation_responses from anon,authenticated;
grant select on observation_responses to authenticated;
create function public.respond_to_observation(report uuid,choice text,seen_at timestamptz) returns void language plpgsql security definer set search_path=public as $$
declare item observations%rowtype;actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'Sign in to add a firsthand update';end if;
 select * into item from observations where id=report;
 if not found or item.status<>'published' or item.expires_at<=now() then raise exception 'Only a current public observation can receive updates';end if;
 if item.author_id=actor then raise exception 'Author updates are not independent confirmations';end if;
 if choice is null or choice not in ('observed','changed','not_observed') or seen_at is null or seen_at>now()+interval '1 minute' or seen_at<greatest(item.observed_at-interval '1 minute',now()-interval '30 days') then raise exception 'Choose a valid firsthand response and observed time';end if;
 perform pg_advisory_xact_lock(hashtext('response:'||actor::text));
 if exists(select 1 from observation_responses where user_id=actor and recorded_at>clock_timestamp()-interval '30 seconds') then raise exception 'Wait 30 seconds before adding another update';end if;
 insert into observation_responses(observation_id,user_id,response,observed_at) values(report,actor,choice,seen_at)
 on conflict(observation_id,user_id) do update set response=excluded.response,observed_at=excluded.observed_at,recorded_at=clock_timestamp();
end $$;
revoke all on function respond_to_observation(uuid,text,timestamptz) from public,anon;
grant execute on function respond_to_observation(uuid,text,timestamptz) to authenticated;
create function public.observation_response_summary(report uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('observed',count(*) filter(where r.response='observed'),'changed',count(*) filter(where r.response='changed'),'not_observed',count(*) filter(where r.response='not_observed'),'latest',max(r.observed_at))
 from observation_responses r join observations o on o.id=r.observation_id
 where o.id=report and o.status='published' and r.user_id<>o.author_id and r.observed_at>now()-observation_lifetime(o.taxonomy_version,o.event_type_id)
$$;
revoke all on function observation_response_summary(uuid) from public;
grant execute on function observation_response_summary(uuid) to anon,authenticated;
create table public.followed_places(
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users on delete cascade,
 name text not null check(length(trim(name)) between 1 and 160),
 latitude numeric(5,2) not null check(latitude between -90 and 90),longitude numeric(6,2) not null check(longitude between -180 and 180),
 created_at timestamptz not null default now(),unique(user_id,latitude,longitude)
);
alter table followed_places enable row level security;
create policy followed_place_self on followed_places for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on followed_places from anon,authenticated;
grant select,insert,delete on followed_places to authenticated;
-- Supabase default function grants may have explicitly granted anon, independently of PUBLIC.
revoke execute on function my_observations(),staff_review_queue(),review_queue(),moderate_report(uuid,text,text),moderate_media(uuid,text,text),set_observation_assessment(uuid,text,text,text,text,text,timestamptz),review_observation(uuid,text,text,text,boolean,text,text,text,text) from public,anon;
grant execute on function my_observations(),staff_review_queue(),review_queue(),moderate_report(uuid,text,text),moderate_media(uuid,text,text),set_observation_assessment(uuid,text,text,text,text,text,timestamptz),review_observation(uuid,text,text,text,boolean,text,text,text,text) to authenticated;

create or replace view public.observation_feed with (security_invoker=true) as
 select o.id,o.category,o.kind,o.title,o.description,o.latitude,o.longitude,o.place_name,o.observed_at,o.details,o.created_at,o.updated_at,o.verification,o.status,o.taxonomy_version,o.domain_id,o.topic_id,o.event_type_id,o.related_type_ids,o.answers,o.privacy_class,a.*,o.expires_at,o.extent,observation_response_summary(o.id) as response_summary
 from observations o cross join lateral get_public_assessment(o.id) a;

create or replace function public.observations_in_bounds(west double precision,south double precision,east double precision,north double precision) returns setof public.observation_feed language plpgsql stable security definer set search_path=public as $$
begin
 if west is null or east is null or north is null or south is null or west not between -180 and 180 or east not between -180 and 180 or south not between -90 and 90 or north not between -90 and 90 or south>north then raise exception 'Invalid map bounds';end if;
 return query select f.* from observation_feed f join observations o on o.id=f.id
 where o.status='published' and o.privacy_class<>'restricted' and o.expires_at>now() and (
 (west<=east and extensions.st_intersects(coalesce(o.extent_geometry,o.location::extensions.geometry),extensions.st_makeenvelope(west,south,east,north,4326))) or
 (west>east and (extensions.st_intersects(coalesce(o.extent_geometry,o.location::extensions.geometry),extensions.st_makeenvelope(west,south,180,north,4326)) or extensions.st_intersects(coalesce(o.extent_geometry,o.location::extensions.geometry),extensions.st_makeenvelope(-180,south,east,north,4326))))
 ) order by o.observed_at desc limit 300;
end $$;

create function public.guard_followed_places() returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtext('place:'||new.user_id::text));
 if (select count(*) from followed_places where user_id=new.user_id)>=50 and not exists(select 1 from followed_places where user_id=new.user_id and latitude=new.latitude and longitude=new.longitude) then raise exception 'Remove a followed place before adding another';end if;
 return new;
end $$;
create trigger guard_followed_places before insert on followed_places for each row execute function guard_followed_places();
alter table report_flags drop constraint report_flags_reason_check;
alter table report_flags add constraint report_flags_reason_check check(reason in ('misleading','dangerous','abusive','privacy','impersonation','spam'));

create or replace function public.catalog_policy(version_id integer,domain_key text,topic_key text,type_key text,related text[],answer_values jsonb) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare domain_def jsonb;topic_def jsonb;type_def jsonb;definition jsonb;field_def jsonb;field_key text;answer jsonb;allowed text[]:='{}';types text[];item text;privacy_rank integer:=0;priority boolean:=false;value_text text;dependency jsonb;
begin
 select d.definition into domain_def from observation_catalog_domains d where d.version=version_id and d.id=domain_key;
 select t.definition into topic_def from observation_catalog_topics t where t.version=version_id and t.id=topic_key and t.domain_id=domain_key;
 select t.definition into type_def from observation_catalog_types t where t.version=version_id and t.id=type_key;
 if domain_def is null or topic_def is null or type_def is null or not exists(select 1 from observation_catalog_routes where version=version_id and topic_id=topic_key and type_id=type_key) then raise exception 'Invalid category, topic or observation';end if;
 if related is null or cardinality(related)>3 or cardinality(related)<>(select count(distinct x) from unnest(related) x) or type_key=any(related) then raise exception 'Choose up to three different related observations';end if;
 if answer_values is null or jsonb_typeof(answer_values)<>'object' or octet_length(answer_values::text)>4000 then raise exception 'Invalid observation answers';end if;
 privacy_rank:=greatest(case domain_def->>'privacyFloor' when 'restricted' then 2 when 'coarse' then 1 else 0 end,case topic_def->>'privacyFloor' when 'restricted' then 2 when 'coarse' then 1 else 0 end);
 types:=array[type_key]||related;
 foreach item in array types loop
  select t.definition into definition from observation_catalog_types t where t.version=version_id and t.id=item;
  if definition is null then raise exception 'Unknown related observation';end if;
  privacy_rank:=greatest(privacy_rank,case definition->>'privacy' when 'restricted' then 2 when 'coarse' then 1 else 0 end);
  priority:=priority or coalesce((definition->>'priority')::boolean,false);
  allowed:=allowed||array(select jsonb_array_elements_text(definition->'questions'));
 end loop;
 for field_key,answer in select * from jsonb_each(answer_values) loop
  if not field_key=any(allowed) then raise exception 'Answer is unrelated to the selected observation';end if;
  select q.definition into field_def from observation_catalog_questions q where q.version=version_id and q.id=field_key;
  if field_def is null then raise exception 'Unknown answer field';end if;
  dependency:=field_def->'showWhen';
  if dependency is not null and not coalesce((dependency->'values') ? (answer_values->>(dependency->>'field')),false) then raise exception 'Hidden dependent answer is not allowed';end if;
  value_text:=answer_values->>field_key;
  if field_def->>'type'='choice' then
   if jsonb_typeof(answer)<>'string' or not exists(select 1 from jsonb_array_elements(field_def->'options') o where o->>'value'=value_text) then raise exception 'Choose a listed answer';end if;
  elsif field_def->>'type'='text' then
   if jsonb_typeof(answer)<>'string' or length(trim(value_text))=0 or length(value_text)>(field_def->>'maxLength')::integer then raise exception 'Invalid text answer';end if;
  elsif field_def->>'type'='number' then
   if jsonb_typeof(answer)<>'number' then raise exception 'Invalid numeric answer';end if;
   if value_text::numeric<trunc((field_def->>'min')::numeric) or value_text::numeric>(field_def->>'max')::numeric or trunc(value_text::numeric)<>value_text::numeric then raise exception 'Invalid numeric answer';end if;
  else raise exception 'Unsupported answer field';end if;
  if coalesce((field_def->'coarseValues') ? value_text,false) then privacy_rank:=greatest(privacy_rank,1);end if;
  if coalesce((field_def->'reviewValues') ? value_text,false) then privacy_rank:=2;end if;
  if coalesce((field_def->'priorityValues') ? value_text,false) then priority:=true;end if;
 end loop;
 if 'ice_climbing'=any(types) and answer_values ? 'grade' then
  if answer_values->>'grade_system' not in ('wi','ai','m') or answer_values->>'grade_system' is null or answer_values->>'grade_basis' not in ('published','estimate') or answer_values->>'grade_basis' is null or (answer_values->>'grade') !~ '^(WI|AI|M)?[0-9]{1,2}[+-]?$' then raise exception 'Choose a grade scale, grade and source';end if;
  if (answer_values->>'grade') ~ '^(WI|AI|M)' and (answer_values->>'grade') not like upper(answer_values->>'grade_system')||'%' then raise exception 'Grade does not match its difficulty scale';end if;
  if answer_values->>'grade_basis'='published' and length(trim(coalesce(answer_values->>'route_reference','')))<8 then raise exception 'Published grades need an attributed reference';end if;
 end if;
 return jsonb_build_object('privacy',case privacy_rank when 2 then 'restricted' when 1 then 'coarse' else 'approximate' end,'priority',case when priority then 'priority' else 'normal' end,'legacyCategory',type_def->>'legacyCategory','legacyKind',type_def->>'legacyKind');
end $$;
alter table report_flags add column resolved_at timestamptz;
alter table report_flags add column resolution text check(length(trim(resolution)) between 5 and 2000);
alter table report_flags add column resolved_by uuid references auth.users on delete set null;
revoke select on report_flags from anon,authenticated;
grant select(id,observation_id,reporter_id,reason,created_at,resolved_at,resolution) on report_flags to authenticated;
create function public.staff_flag_queue() returns table(report jsonb,review_priority text,flag_counts jsonb) language plpgsql stable security definer set search_path=public as $$
begin
 if not is_moderator() then raise exception 'Staff authorization required';end if;
 return query select to_jsonb(f),'flagged'::text,(select jsonb_object_agg(x.reason,x.total) from (select rf.reason,count(*) as total from report_flags rf where rf.observation_id=o.id and rf.resolved_at is null group by rf.reason) x)
 from observations o join observation_feed f on f.id=o.id where exists(select 1 from report_flags rf where rf.observation_id=o.id and rf.resolved_at is null)
 order by (select max(rf.created_at) from report_flags rf where rf.observation_id=o.id and rf.resolved_at is null) desc limit 100;
end $$;
revoke all on function staff_flag_queue() from public,anon;
grant execute on function staff_flag_queue() to authenticated;
create function public.resolve_report_flags(report uuid,explanation text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not is_moderator() then raise exception 'Staff authorization required';end if;
 if explanation is null or length(trim(explanation)) not between 5 and 2000 then raise exception 'A resolution reason is required';end if;
 update report_flags set resolved_at=clock_timestamp(),resolution=trim(explanation),resolved_by=auth.uid() where observation_id=report and resolved_at is null;
 if not found then raise exception 'No open flags for this observation';end if;
 insert into moderation_actions(observation_id,moderator_id,action,reason) values(report,auth.uid(),'review','Flags resolved: '||left(trim(explanation),1900));
end $$;
revoke all on function resolve_report_flags(uuid,text) from public,anon;
grant execute on function resolve_report_flags(uuid,text) to authenticated;
