-- Reviewed separately before production rollout. Existing JPEG rows remain compatible.
alter table public.observation_media add column media_kind text not null default 'photo' check(media_kind in ('photo','video'));
alter table public.observation_media add column content_type text not null default 'image/jpeg';
alter table public.observation_media add column duration_seconds double precision;
alter table public.observation_media add constraint observation_media_format check(
 (media_kind='photo' and content_type='image/jpeg' and duration_seconds is null) or
 (media_kind='video' and content_type in ('video/mp4','video/quicktime') and duration_seconds>0 and duration_seconds<=60 and duration_seconds is not null)
);
-- No client writes/policy changes: the existing service-side handler remains mandatory.
update storage.buckets set file_size_limit=20971520,allowed_mime_types=array['image/jpeg','video/mp4','video/quicktime'] where id='observation-media';
