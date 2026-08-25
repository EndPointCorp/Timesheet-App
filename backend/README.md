# Timesheet Backend

Rails 8.1 / Ruby 3.3 API backend. Postgres 16. Runs entirely in Docker.

**The dev/test stack lives at the repo root now** — `make dev-build` there
starts everything (nginx-served SPA on :8080, this API on :8088, Postgres on
:55432) and an empty database is schema-loaded and demo-seeded automatically
on first boot. See `../README.md`. This file covers backend-specific details.

## Setup

```sh
cp .env.example .env        # backend runtime config (dotenv, dev/test only)
cd .. && cp .env.example .env && make dev-build
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

The API is served at <http://localhost:8088/api/> and through nginx at
<http://localhost:8080/api/>. Root `/` on :8088 returns 500 — the SPA is
served by nginx (:8080), not by Rails.

## Everyday commands

Run from the repo root (the compose stack lives there; make targets wrap it):

```sh
make dev / make logs / make dev-down                    # see ../README.md
docker compose exec db psql -U timesheet -d timesheet   # psql into db
docker compose run --rm -e CONTAINER_ROLE=task backend bin/rails c   # console
```

## Running the test suite

Docker-only (host Ruby can't build the native gems). The suite runs against an
isolated `timesheet_test` DB, so it never touches your dev data.

```sh
make test-db   # one-time: create timesheet_test, load schema, populate matviews
make test      # run RSpec
make coverage  # run with SimpleCov -> coverage/index.html
```

(These targets delegate to the repo-root Makefile; run them from either
directory.) `make test-db` is idempotent — re-run it any time to reset the test
DB. It loads `db/structure.sql` through the Rails `pg` connection and then
populates the `chart_labels`, `charts_search_specs`, and `project_summaries`
materialized views, which the suite's truncation depends on.

## Reset the database

```sh
cd .. && make dev-clean     # destroys the postgres volume
make dev                    # fresh boot: schema + demo seeds reload automatically
```

## Troubleshooting

**"A server is already running. Check /rails/tmp/pids/server.pid"**
Stale PID. `tmp/` is a tmpfs in dev, so `make dev-down && make dev` clears it.

**"relation chart_labels does not exist" during seed**
You loaded `reference_data.sql` through a Rails connection by hand. pg_dump
emits `SELECT pg_catalog.set_config('search_path', '', false);` which
clobbers that connection's search_path. Use the entrypoint's `db:prepare`
path (automatic) or load it via `psql` in the `db` container.

**Password auth fails after changing `DATABASE_PASSWORD`**
Postgres only reads `POSTGRES_PASSWORD` on first volume init. To resync:

```sh
docker compose exec db psql -U timesheet -d timesheet \
  -c "ALTER USER timesheet WITH PASSWORD 'newpassword';"
```

## Configuration

All runtime config comes from env vars. In dev/test they load from `.env`
via dotenv (gitignored); in preview/production Coolify injects them. See
`.env.example` for the full list. Key vars: `DATABASE_*`, `SECRET_KEY_BASE`,
`APP_HOST`, `SMTP_*`, `MAILER_*`, `WORK_CHART_ROOT_ID`,
`WORK_CHART_CLIENTS_ID`, `TEAM_ROLE_ID`.

## Schema changes

Schema format is `:sql`. After `rails db:migrate`, `db/structure.sql` is
regenerated automatically. Commit it with the migration.

## Scheduled & background work

Not deployed. The app defines delayed_job (`rake jobs:work`) and cron-driven
rakes (`cron:tick`, `mail:send`, `activate:workcharts`), but no interactive
flow depends on them — they only drive reminder emails and workchart
housekeeping. Worker/scheduler services get reintroduced at production
cutover; see `COOLIFY.md § Production — DEFERRED`.
