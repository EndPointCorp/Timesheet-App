# End Point Timesheet

Time tracking and reporting. A Rails 8 JSON API (`railsts/`) and a React
frontend (`timesheet-frontend/`).

## Run it

```sh
docker compose up
```

Open <http://localhost:3000> and sign in as `admin@example.com` / `please1234`.

**If that first login says your password is wrong, it isn't — just sign in
again.** The first request after the server starts always fails
authentication ([#25]). Nothing is misconfigured, and the second attempt works.

That's the whole setup. The first run takes a few minutes: it builds both
images, then loads the schema, reference data, and demo seed into an empty
database. Later runs skip all of that.

Once it's up:

- Frontend: <http://localhost:3000>
- API: <http://localhost:3001/api/>
- Postgres: `localhost:55432`

If a port is already taken, put the one you want in a `.env` file next to
`compose.yml` — `WEB_PORT=3100`, `API_PORT`, `DB_PORT`. Everything is published
on `127.0.0.1` only, so none of it is reachable from your network.

## What runs where

`compose.yml` at the root defines three services:

- **db** — Postgres 16
- **api** — Rails, at `railsts/`. Loads the database on first run, then serves
  `/api`.
- **web** — the React dev server, at `timesheet-frontend/`. Hot-reloads your
  edits and proxies `/api` to the API (see `src/setupProxy.js`).

Both source trees are bind-mounted, so edits show up without a rebuild. Change
a `Gemfile` or `package.json` and you need `docker compose up --build`.

## Scope

`compose.yml` is for working on the app, not for running it in production. It
builds images on your machine and mounts your source, neither of which belongs
on a server. A deployment should pull prebuilt, tagged images and serve a
compiled frontend from a web server.

The safe defaults are kept anyway, because they cost nothing: containers run as
a non-root user, no `.env` is baked into an image, image tags are pinned to a
patch version, and every port binds to `127.0.0.1`. The database password is in
the open in `compose.yml` on purpose — it guards a database only your own
machine can reach, and hiding it in a committed `.env.example` would have been
theatre. Give it a real one the moment anything else can reach it.

## More

- `railsts/README.md` — backend details, test suite, troubleshooting
- `timesheet-frontend/README.md` — frontend, Playwright e2e suite, camp deploys
- `testing/checklist.md` — the manual test checklist, and how to judge a run

[#25]: https://bits.endpointdev.com/timesheet/timesheet-oss/-/issues/25
