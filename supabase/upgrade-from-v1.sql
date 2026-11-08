-- Only for a populated v1-only database, as the database owner, before applying migration 202611080001.
-- Direct API sessions remain protected; migration 202611080002 replaces this temporary maintenance-aware guard.
create or replace function public.guard_observation() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if session_user=current_user and auth.uid() is null and tg_op='UPDATE' then return new;end if;
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
