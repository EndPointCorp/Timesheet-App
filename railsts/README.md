# Timesheet Backend

Rails 8.1 / Ruby 3.3.6 API backend. Postgres 16.

Setup, credentials, and ports live in the [root README](../README.md). The stack
is defined by `compose.yml` there, which runs this API alongside the React
frontend. Compose finds that file from this directory, so `docker compose ...`
works from here too. The Rails service is named `api` (`web` is the frontend).

This file covers the backend itself: the API, commands, tests, troubleshooting,
and schema.

## The API

Served at <http://localhost:3001/api/>. Verify it's up:

```sh
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/users
# expect: 401  (endpoint exists, auth required)
```

Use the frontend at <http://localhost:3000> for the actual app — it proxies
`/api` here. Hitting the API's `/` directly returns 500 on its own; it expects a
compiled React bundle that isn't there in this split setup.

Seeds create `admin@example.com` / `please1234`, the only superuser, plus 9 demo
users (alice, bob, charlie, diana, evan, fiona, george, hannah, isaac) sharing
that password. `db:seed` runs on every start and is safe to repeat: it tops the
demo set up to a fixed size rather than appending to it.

## Everyday commands

```sh
docker compose up -d                                    # start db + api + web
docker compose stop                                     # stop everything
docker compose logs -f api                              # tail api logs
docker compose exec db psql -U timesheet -d timesheet   # psql into db
docker compose run --rm api bundle exec rails c         # rails console
docker compose exec api bundle exec rails db:migrate    # run migrations
```

Migrations are **not** run automatically on boot. Schema format is `:sql`, so
migrating rewrites `db/structure.sql` — which is bind-mounted from your
checkout. Running it on every start would leave you with a dirty working tree
each time you brought the stack up.

## Running the test suite

The suite runs against an isolated `timesheet_test` DB, so it never touches your
dev data.

```sh
make test-db   # one-time: create timesheet_test, load schema, populate matviews
make test      # run RSpec
make coverage  # run with SimpleCov -> coverage/index.html
```

`make test-db` is idempotent — re-run it any time to reset the test DB. It loads
`db/structure.sql` and then populates the `chart_labels`,
`charts_search_specs`, and `project_summaries` materialized views, which the
suite's truncation depends on.

## Reset the database

```sh
docker compose down -v      # destroys the postgres volume
docker compose up           # reloads schema, reference data, and seeds
```

## Troubleshooting

**"A server is already running. Check /app/tmp/pids/server.pid"**
Stale PID from a killed container. The api service's start command clears it, so
`docker compose restart api` is usually enough.

**"relation chart_labels does not exist" during seed**
Reference data was loaded through Rails instead of `psql`. Postgres loads
`db/structure.sql` and `db/seeds/reference_data.sql` itself the first time the
data volume is created — `compose.yml` mounts them into its init directory. They
have to go through `psql`, because pg_dump emits meta-commands and a
`search_path` reset that the Rails connection cannot cope with. Recover by
re-initialising: `docker compose down -v && docker compose up`.

**Password auth fails after changing `POSTGRES_PASSWORD`**
Postgres only reads `POSTGRES_PASSWORD` when it first initialises the volume.
An existing volume keeps its original password, so changing `.env` alone is not
enough. Either re-init (`docker compose down -v`, which destroys the data) or
resync in place:

```sh
docker compose exec db psql -U timesheet -d timesheet \
  -c "ALTER USER timesheet WITH PASSWORD 'the-value-from-your-.env';"
```

## Configuration

App-level config lives in this directory's `.env` (gitignored); see
`.env.example` here for the full list. Key vars: `MAILER_FROM_EMAIL`,
`WORK_CHART_ROOT_ID`, `WORK_CHART_CLIENTS_ID`, `TEAM_ROLE_ID`.

The `DATABASE_*` vars there apply when you run Rails on the host; under Compose
the values in `compose.yml` take precedence, because dotenv does not overwrite
variables that are already set. Database name, credentials, and host ports are
compose-level — see the root README.

## Schema changes

Schema format is `:sql`. After `rails db:migrate`, `db/structure.sql` is
regenerated automatically. Commit it with the migration.
