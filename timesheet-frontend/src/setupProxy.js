// Dev-server proxy for the Rails API.
//
// The app calls "/api" on its own origin (see src/constants.ts), so the dev
// server has to forward those requests to Rails. That used to be the "proxy"
// field in package.json — a fixed string in a tracked file, which cannot differ
// between a laptop and a container without editing the repo. Reading it from the
// environment keeps the target as configuration.
//
// Not used by `npm run build`: a production bundle is served by a real web
// server, and that server does the proxying.
//
// Rails mounts its routes under `scope '/api'` (config/routes.rb), so the prefix
// is forwarded as-is rather than stripped.
const { createProxyMiddleware } = require("http-proxy-middleware");

// Matches the API port that docker-compose.yml publishes by default, for
// running the dev server outside Docker against a containerised API. Point it
// somewhere else with API_PROXY_TARGET — bin/wt writes one per worktree so each
// dev server talks to its own stack instead of whichever one started first.
const DEFAULT_TARGET = "http://localhost:8088";

module.exports = function (app) {
  const target = process.env.API_PROXY_TARGET || DEFAULT_TARGET;

  app.use(
    "/api",
    createProxyMiddleware({
      target,
      // Must stay false. Rails' HostAuthorization middleware only accepts known
      // hosts in development and answers 403 to anything else. changeOrigin:true
      // would rewrite Host to the target ("backend:3000" under Docker), which
      // Rails rejects. Left alone, Rails sees the browser's own Host and is
      // happy.
      changeOrigin: false,
    }),
  );
};