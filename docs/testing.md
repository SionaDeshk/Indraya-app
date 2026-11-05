# Reproduce database tests
Use a disposable PostGIS 17 database created from template0. Never run the bootstrap on an existing Supabase project: it emulates auth/storage schemas and roles.

1. Start `docker run -d --name indraya-db-test -e POSTGRES_HOST_AUTH_METHOD=trust postgis/postgis:17-3.5` without publishing any port.
2. `docker exec indraya-db-test createdb -U postgres -T template0 indraya`
3. Pipe supabase/tests/bootstrap.sql, then supabase/migrations/202611050001_initial.sql, then supabase/tests/rls.sql to `docker exec -i indraya-db-test psql -U postgres -d indraya -v ON_ERROR_STOP=1` in that order.
4. Tests run in a transaction and roll back. Remove only the test container you created using `docker rm -f indraya-db-test`.

The harness tests SQL policies and grants, not the hosted Auth email flow, REST API schema cache or Storage service. Test those against a project before launch. No private credentials are needed for local SQL tests.
