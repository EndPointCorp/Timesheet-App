# End Point Timesheet

Time tracking and reporting. A Rails 8 JSON API (`railsts/`) and a React
frontend (`timesheet-frontend/`).

## Run it

```sh
cp .env.example .env
make dev-build
```

Open <http://localhost:8080> and sign in as `admin@example.com` / `please1234`.

**If that first login says your password is wrong, it isn't — just sign in
again.** The first request after the server starts always fails
authentication ([#25]). Nothing is misconfigured, and the second attempt works.

That's the whole setup. The first run takes a few minutes: it builds both
images, then loads the schema, reference data, and demo seed into an empty
database. Later runs skip all of that — `make dev` is enough once the images
exist.

Once it's up:

- Frontend: <http://localhost:8080>
- API: <http://localhost:8088/api/>
- Postgres: `localhost:55432`

`/` on port 8088 returns 500. Rails serves the API only; nginx serves the app.

Other targets: `make logs`, `make dev-down`, `make dev-clean` (drops the
database volume), `make dev-config` (print the resolved compose file).

## What runs where

`docker-compose.yml` at the root defines three services:

- **db** — Postgres 16.
- **backend** — Rails, at `railsts/`. Built from the `dev` stage of
  `railsts/Dockerfile`. Loads the database on first run, then serves `/api`.
  Your source is bind-mounted, so edits reload.
- **frontend** — nginx, at `timesheet-frontend/`. Serves the compiled bundle
  and reverse-proxies `/api` to the backend (`nginx/default.conf`).

The frontend image is a production build, so it does **not** hot-reload. For
that, run the React dev server on your machine instead — `npm start` in
`timesheet-frontend/` serves port 3000 and proxies `/api` to port 8088, against
the same containers. See `timesheet-frontend/README.md`.

Change a `Gemfile` or `package.json` and you need `make dev-build`.

## Tests

```sh
make test-db   # one-time: create the test DB, load the schema, build matviews
make test      # RSpec
make coverage  # RSpec with SimpleCov -> railsts/coverage/index.html
```

These work from `railsts/` too — that Makefile delegates here.

## Previews and deploys

`.gitlab-ci.yml` builds both images on every pipeline and, for a merge request,
hands them to Coolify through `scripts/coolify-preview.py`, which stands up a
per-MR environment from `docker-compose.preview.yml`. That file is standalone
on purpose: Coolify deploys exactly one compose file and does not merge
overlays. Production deploys are deliberately not wired up yet.

## Scope

`docker-compose.yml` is for working on the app, not for running it in
production. It builds images on your machine and mounts your source, neither of
which belongs on a server. The preview and production paths pull prebuilt,
tagged images instead.

The safe defaults are kept anyway, because they cost nothing: the production
image runs as a non-root user, no `.env` is baked into an image, and image tags
are pinned. `DATABASE_PASSWORD` has no default — compose refuses to start
without a `.env` — so nothing ships with a password that was committed.

## More

- `railsts/README.md` — backend details, test suite, troubleshooting
- `timesheet-frontend/README.md` — frontend, Playwright e2e suite, camp deploys
- `testing/checklist.md` — the manual test checklist, and how to judge a run

[#25]: https://bits.endpointdev.com/timesheet/timesheet-oss/-/issues/25
