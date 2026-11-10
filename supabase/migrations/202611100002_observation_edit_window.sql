-- PROPOSED ONLY: requires explicit production approval. Ten-minute correction window.
-- Existing observations/data are not rewritten. This restricts author UPDATE access.
-- Do not modify observations once moderation or independent responses exist.
create function public.guard_author_correction() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if current_setting('role',true)='none' and session_user in ('postgres','supabase_admin') then return new;end if;
 if public.is_moderator() then return new;end if;
 if auth.uid() is null or old.author_id<>auth.uid() or old.status<>'published' or old.verification<>'unverified'
    or old.created_at>clock_timestamp() or old.created_at+interval '10 minutes'<=clock_timestamp()
    or exists(select 1 from observation_responses where observation_id=old.id)
    or exists(select 1 from observation_assessments where observation_id=old.id)
 then raise exception 'Correction window closed';end if;
 if (to_jsonb(new)-array['description','answers','location','extent_geometry']) is distinct from (to_jsonb(old)-array['description','answers','location','extent_geometry'])
 then raise exception 'Only notes and condition details can be corrected';end if;
 return new;
end $$;
-- Runs before catalog/lifecycle/privacy processing; those existing checks still apply.
create trigger a0_guard_author_correction before update on public.observations for each row execute function public.guard_author_correction();
create function public.correct_observation(report uuid,note text,condition_answers jsonb) returns void language plpgsql security definer set search_path=public as $$
declare item observations%rowtype;
begin
 if auth.uid() is null then raise exception 'Sign in to correct your observation';end if;
 select * into item from observations where id=report for update;
 if not found or item.author_id<>auth.uid() then raise exception 'Observation unavailable';end if;
 -- Check explicitly even for an author who also has a moderator role.
 if item.status<>'published' or item.verification<>'unverified' or item.created_at>clock_timestamp()
   or item.created_at+interval '10 minutes'<=clock_timestamp()
   or exists(select 1 from observation_responses where observation_id=item.id)
   or exists(select 1 from observation_assessments where observation_id=item.id)
 then raise exception 'Correction window closed';end if;
 if note is null or length(note)>2000 or condition_answers is null or jsonb_typeof(condition_answers)<>'object' or octet_length(condition_answers::text)>8000
 then raise exception 'Invalid correction';end if;
 update observations set description=trim(note),answers=condition_answers where id=item.id;
end $$;
revoke all on function public.guard_author_correction() from public,anon,authenticated;
revoke all on function public.correct_observation(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.correct_observation(uuid,text,jsonb) to authenticated;
