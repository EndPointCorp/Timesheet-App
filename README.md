# End Point Timesheet

Time tracking and reporting. A Rails 8 JSON API (`backend/`) and a React
frontend (`frontend/`).

## Run it

```sh
cp .env.example .env
make dev-build
```

Open <http://localhost:8080> and sign in as `admin@example.com` / `please1234`.

**If that first login says your password is wrong, it isn't — just sign in
again.** The first request after the server starts always fails
authentication. This is a known issue. Nothing is misconfigured, and the
second attempt works.

That's the whole setup. The first run takes a few minutes: it builds both
images, then loads the schema, reference data, and demo seed into an empty
database. Later runs skip all of that — `make dev` is enough once the images
exist.

Once it's up:

- Frontend: <http://localhost:8080>
- API: <http://localhost:8088/api/>
- Postgres: `localhost:55432`

`/` on port 8088 returns 500. Rails serves the API only; port 8080 serves the app.

Other targets: `make logs`, `make dev-down`, `make dev-clean` (drops the
database volume), `make dev-config` (print the resolved compose file).

## What runs where

`docker-compose.yml` at the root defines three services:

- **db** — Postgres 16.
- **backend** — Rails, at `backend/`. Built from the `dev` stage of
  `backend/Dockerfile`. Loads the database on first run, then serves `/api`.
  Your source is bind-mounted, so edits reload.
- **frontend** — the React dev server, at `frontend/`. Built from the
  `dev` stage of `frontend/Dockerfile`. Your source is bind-mounted,
  so edits reload, and it forwards `/api` to the backend (`src/setupProxy.js`).

Previews and production do not run that dev server. They serve a compiled
bundle from nginx — the last stage of the same Dockerfile, with the proxying
done by `nginx/default.conf`. That is what CI builds and what
`docker-compose.preview.yml` deploys.

You can also run the dev server on your machine rather than in the stack:
`npm start` in `frontend/` proxies `/api` to port 8088 against the
same containers. See `frontend/README.md`.

Change a `Gemfile` or `package.json` and you need `make dev-build`.

## Tests

```sh
make test-db   # one-time: create the test DB, load the schema, build matviews
make test      # RSpec
make coverage  # RSpec with SimpleCov -> backend/coverage/index.html
```

These work from `backend/` too — that Makefile delegates here.

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

- `backend/README.md` — backend details, test suite, troubleshooting
- `frontend/README.md` — frontend, Playwright e2e suite, camp deploys
- `testing/checklist.md` — the manual test checklist, and how to judge a run

## License

MIT. See [LICENSE](LICENSE).
