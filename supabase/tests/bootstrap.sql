-- Disposable PostgreSQL/PostGIS harness: emulate Supabase auth identities and API roles.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema storage;
create schema extensions;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table storage.buckets(id text primary key,name text,public boolean);
grant usage on schema public,auth,extensions to anon,authenticated;
alter default privileges in schema public grant all on tables to anon,authenticated;
