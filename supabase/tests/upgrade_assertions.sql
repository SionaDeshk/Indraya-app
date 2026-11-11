\set ON_ERROR_STOP on
do $$ begin
 if (select count(*) from observations where created_at='2025-01-01' and updated_at='2025-02-01' and observed_at=created_at and author_id='00000000-0000-0000-0000-000000000001' and domain_id is not null and title like 'Legacy % fixture' and description='FICTIONAL upgrade preservation fixture.' and latitude=61.22 and longitude=-149.90)<>3 then raise exception 'Upgrade lost ownership, timestamps or records';end if;
 if (select status from observations where id='22222222-2222-2222-2222-222222222222')<>'hidden' then raise exception 'Hidden row changed';end if;
 if (select status from observations where id='33333333-3333-3333-3333-333333333333')<>'review' then raise exception 'Held row changed';end if;
 if not exists(select 1 from observation_media where storage_path='upgrade-photo.jpg' and observation_id='11111111-1111-1111-1111-111111111111') then raise exception 'Photo association lost';end if;
 raise notice 'PASS: populated legacy rows preserve status, author, timestamps, text, taxonomy and photo association';
end $$;
