# Timesheet Backend

Rails 5.0 / Ruby 2.4 API backend. Postgres 16. Runs entirely in Docker.

## Prerequisites

Docker Desktop (or Docker Engine + Compose plugin). Nothing else.

## Setup

```sh
cp .env.example .env
docker compose build
docker compose up -d db
```

Wait for Postgres to accept connections:

```sh
until docker compose exec -T db pg_isready -U timesheet -d timesheet; do sleep 1; done
```

Load schema and reference data via `psql` (the `web` image has no `psql`
binary, and loading reference data through Rails breaks its connection's
search_path — so both files go through the `db` container):

```sh
docker compose exec -T db psql -U timesheet -d timesheet -v ON_ERROR_STOP=1 \
  < db/structure.sql

docker compose exec -T db psql -U timesheet -d timesheet -v ON_ERROR_STOP=1 \
  < db/seeds/reference_data.sql
```

Seed demo data and start the web server:

```sh
docker compose run --rm web bundle exec rails db:seed
docker compose up -d web
```

Verify it's up:

```sh
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8088/api/users
# expect: 401  (endpoint exists, auth required)
```

## Login

```text
Email:    admin@example.com
Password: please1234
```

9 additional demo users (alice, bob, charlie, diana, evan, fiona,
george, hannah, isaac) share the same password. Only `admin` is
superuser.

App is served at <http://localhost:8088/api/>. Root `/` returns 500 on
its own — it expects the compiled React frontend (`timesheet-frontend`).

## Everyday commands

```sh
docker compose up -d                                    # start db + web
docker compose stop                                     # stop everything
docker compose logs -f web                              # tail web logs
docker compose exec db psql -U timesheet -d timesheet   # psql into db
docker compose run --rm web bundle exec rails c        # rails console
```

## Running the test suite

Docker-only (host Ruby can't build the native gems). The suite runs against an
isolated `timesheet_test` DB, so it never touches your dev data.

```sh
make test-db   # one-time: create timesheet_test, load schema, populate matviews
make test      # run RSpec (142 examples)
make coverage  # run with SimpleCov -> coverage/index.html
```

`make test-db` is idempotent — re-run it any time to reset the test DB. It loads
`db/structure.sql` through the Rails `pg` connection (the `web` image has no
`psql` binary) and then populates the `chart_labels`, `charts_search_specs`, and
`project_summaries` materialized views, which the suite's truncation depends on.

## Reset the database

```sh
docker compose down -v      # destroys the postgres volume
docker compose up -d db
# then re-run the Setup steps from "Load schema..." onward
```

## Troubleshooting

**"A server is already running. Check /app/tmp/pids/server.pid"**
Stale PID. `docker compose run --rm web rm -f /app/tmp/pids/server.pid`
then `docker compose restart web`.

**"relation chart_labels does not exist" during seed**
You loaded `reference_data.sql` through Rails instead of `psql`. pg_dump
emits `SELECT pg_catalog.set_config('search_path', '', false);` which
clobbers the Rails connection's search_path for the rest of the process.
Use the `psql` commands in the Setup section.

**Password auth fails after changing `DATABASE_PASSWORD`**
Postgres only reads `POSTGRES_PASSWORD` on first volume init. To resync:

```sh
docker compose exec db psql -U timesheet -d timesheet \
  -c "ALTER USER timesheet WITH PASSWORD 'newpassword';"
```

## Configuration

All runtime config is in `.env` (gitignored). See `.env.example` for the
full list. Key vars: `DATABASE_*`, `MAILER_FROM_EMAIL`,
`WORK_CHART_ROOT_ID`, `WORK_CHART_CLIENTS_ID`, `TEAM_ROLE_ID`.

## Schema changes

Schema format is `:sql`. After `rails db:migrate`, `db/structure.sql` is
regenerated automatically. Commit it with the migration.
