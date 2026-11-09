-- Proposed only. Never edit/reapply the six migrations already deployed.
create table public.observation_submissions(
 user_id uuid not null references auth.users on delete cascade,
 request_id uuid not null,
 payload_digest text not null,
 observation_id uuid references public.observations on delete set null,
 created_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
alter table public.observation_submissions enable row level security;
revoke all on public.observation_submissions from public,anon,authenticated;
-- No direct policies/grants. The checked RPC returns only the caller's receipt.
create function public.submit_observation(request_id uuid,payload jsonb)
returns table(id uuid,status text) language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();receipt observation_submissions%rowtype;made observations%rowtype;fingerprint text;
begin
 if actor is null then raise exception 'Sign in before sharing';end if;
 if request_id is null or payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>16000 then raise exception 'Invalid submission';end if;
 if exists(select 1 from jsonb_object_keys(payload) k where k not in ('category','kind','title','description','latitude','longitude','place_name','observed_at','details','extent','taxonomy_version','domain_id','topic_id','event_type_id','related_type_ids','answers')) then raise exception 'Unsupported submission field';end if;
 fingerprint:=encode(sha256(convert_to(payload::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':'||request_id::text,0));
 select * into receipt from observation_submissions s where s.user_id=actor and s.request_id=submit_observation.request_id;
 if found then
  if receipt.payload_digest<>fingerprint then raise exception 'This save already has different content. Recover it before starting another observation';end if;
  select * into made from observations o where o.id=receipt.observation_id and o.author_id=actor;
  if not found then raise exception 'Saved observation is no longer available';end if;
  return query select made.id,made.status;return;
 end if;
 -- Explicit columns prevent clients injecting author, status, verification,
 -- expiry or timestamps. Existing catalog/privacy/lifecycle triggers still run.
 insert into observations(author_id,category,kind,title,description,latitude,longitude,place_name,observed_at,details,extent,taxonomy_version,domain_id,topic_id,event_type_id,related_type_ids,answers)
 values(actor,payload->>'category',payload->>'kind',payload->>'title',payload->>'description',(payload->>'latitude')::double precision,(payload->>'longitude')::double precision,payload->>'place_name',(payload->>'observed_at')::timestamptz,payload->'details',nullif(payload->'extent','null'::jsonb),(payload->>'taxonomy_version')::integer,payload->>'domain_id',payload->>'topic_id',payload->>'event_type_id',array(select jsonb_array_elements_text(payload->'related_type_ids')),payload->'answers') returning * into made;
 insert into observation_submissions(user_id,request_id,payload_digest,observation_id) values(actor,request_id,fingerprint,made.id);
 return query select made.id,made.status;
end $$;
revoke all on function public.submit_observation(uuid,jsonb) from public,anon;
grant execute on function public.submit_observation(uuid,jsonb) to authenticated;
