#!/usr/bin/env python3
"""Drive Coolify from GitLab CI: preview apps per MR, image bumps for prod.

Ported from the ovis reference implementation (stdlib only — runs on a bare
alpine+python3 CI job). Subcommands:

  deploy-preview --mr N --branch BRANCH --frontend-image IMG --backend-image IMG
      Find-or-create the Coolify app `timesheet-mr-N` (docker compose build
      pack reading /docker-compose.preview.yml from this repo), point the
      Domains field at the nginx `frontend` service, push env vars, deploy.

  delete-preview --mr N
      Delete the app and its volumes (MR close/merge cleanup).

  deploy-prod --frontend-image IMG --backend-image IMG
      Bump IMAGE_TAG_* on the pre-created production app and redeploy.

Required env vars (GitLab CI/CD variables):
  COOLIFY_URL, COOLIFY_API_TOKEN
  deploy-preview also needs: COOLIFY_PROJECT_UUID, COOLIFY_SERVER_UUID,
    COOLIFY_ENVIRONMENT_NAME, COOLIFY_PRIVATE_KEY_UUID, GIT_REPOSITORY_URL,
    PREVIEW_DOMAIN, COOLIFY_PREVIEW_DB_PASSWORD, COOLIFY_PREVIEW_SECRET_KEY_BASE
  deploy-prod also needs: COOLIFY_PROD_APP_UUID
"""

import json
import os
import sys
import urllib.error
import urllib.request

APP_PREFIX = "timesheet-mr-"
PUBLIC_SERVICE = "frontend"   # compose service the Domains field routes to
PUBLIC_PORT = "80"
COMPOSE_LOCATION = "/docker-compose.preview.yml"


def fail(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def require_env(name):
    val = os.environ.get(name)
    if not val:
        fail(f"required env var {name} is not set")
    return val


def api(method, path, body=None):
    url = f"{os.environ['COOLIFY_URL']}/api/v1{path}"
    data = json.dumps(body).encode() if body else None
    headers = {
        "Authorization": f"Bearer {os.environ['COOLIFY_API_TOKEN']}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    print(f"[API] -> {method} {path}", file=sys.stderr)
    if body:
        compact = json.dumps(body)
        print(f"[API] -> body: {compact if len(compact) < 300 else compact[:300] + '...'}",
              file=sys.stderr)

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            status = r.status
            raw = r.read().decode()
    except urllib.error.HTTPError as e:
        status = e.code
        raw = e.read().decode()
    except urllib.error.URLError as e:
        fail(f"network error calling {method} {path}: {e.reason}")

    print(f"[API] <- HTTP {status}", file=sys.stderr)

    if raw:
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = raw
    else:
        parsed = None

    if status >= 300:
        print("[API] <- error body:", file=sys.stderr)
        if isinstance(parsed, (dict, list)):
            print(json.dumps(parsed, indent=2), file=sys.stderr)
        else:
            print(parsed, file=sys.stderr)

    return status, parsed


def find_app_uuid_by_name(name):
    status, apps = api("GET", "/applications")
    if status >= 300:
        fail(f"failed to list applications (HTTP {status})")
    for a in apps:
        if a.get("name") == name:
            return a["uuid"]
    return None


def set_env_var(app_uuid, key, value):
    """POST creates new, PATCH updates existing. Try create first, fall back to update on 409."""
    body = {"key": key, "value": value, "is_preview": False}
    status, _ = api("POST", f"/applications/{app_uuid}/envs", body)
    if status == 409:
        status, _ = api("PATCH", f"/applications/{app_uuid}/envs", body)
    if status >= 300:
        fail(f"failed to set env var {key} (HTTP {status})")


def trigger_deploy(app_uuid):
    status, _ = api("GET", f"/deploy?uuid={app_uuid}&force=false")
    if status >= 300:
        fail(f"failed to trigger deploy for {app_uuid} (HTTP {status})")
    print(f"Deploy triggered for {app_uuid}")


def parse_args(args, spec):
    """spec: {'--mr': 'mr', ...} -> dict of values; every key is required."""
    out = {}
    i = 0
    while i < len(args):
        if args[i] in spec:
            if i + 1 >= len(args):
                fail(f"missing value for {args[i]}")
            out[spec[args[i]]] = args[i + 1]
            i += 2
        else:
            fail(f"Unknown arg: {args[i]}")
    for flag, key in spec.items():
        if key not in out:
            fail(f"{flag} is required")
    return out


def deploy_preview(args):
    opts = parse_args(args, {
        "--mr": "mr",
        "--branch": "branch",
        "--frontend-image": "frontend_image",
        "--backend-image": "backend_image",
    })
    mr = opts["mr"]

    require_env("COOLIFY_URL")
    require_env("COOLIFY_API_TOKEN")
    require_env("COOLIFY_PROJECT_UUID")
    require_env("COOLIFY_SERVER_UUID")
    require_env("COOLIFY_ENVIRONMENT_NAME")
    require_env("COOLIFY_PREVIEW_DB_PASSWORD")
    require_env("COOLIFY_PREVIEW_SECRET_KEY_BASE")
    require_env("PREVIEW_DOMAIN")
    require_env("GIT_REPOSITORY_URL")
    require_env("COOLIFY_PRIVATE_KEY_UUID")

    app_name = f"{APP_PREFIX}{mr}"
    fqdn = f"mr-{mr}.{os.environ['PREVIEW_DOMAIN']}"

    app_uuid = find_app_uuid_by_name(app_name)

    if not app_uuid:
        print(f"Creating new Coolify app: {app_name} (branch: {opts['branch']})")
        body = {
            "name": app_name,
            "project_uuid": os.environ["COOLIFY_PROJECT_UUID"],
            "server_uuid": os.environ["COOLIFY_SERVER_UUID"],
            "environment_name": os.environ["COOLIFY_ENVIRONMENT_NAME"],
            "private_key_uuid": os.environ["COOLIFY_PRIVATE_KEY_UUID"],
            "git_repository": os.environ["GIT_REPOSITORY_URL"],
            "git_branch": opts["branch"],
            "build_pack": "dockercompose",
            "ports_exposes": PUBLIC_PORT,
            "docker_compose_location": COMPOSE_LOCATION,
            "docker_compose_domains": [{"name": PUBLIC_SERVICE, "domain": f"https://{fqdn}"}],
            "instant_deploy": False,
        }
        status, response = api("POST", "/applications/private-deploy-key", body)
        if status >= 300:
            fail("Failed to create app (see API response above)")
        app_uuid = response.get("uuid") if isinstance(response, dict) else None
        if not app_uuid:
            fail(f"Coolify did not return an application UUID. Response: {response}")
        print(f"Created app with UUID: {app_uuid}")
    else:
        print(f"Updating existing Coolify app: {app_name} (uuid: {app_uuid})")

    # Coolify has been seen silently dropping docker_compose_domains; read the
    # app back and hard-fail rather than deploy an unreachable preview.
    status, app_state = api("GET", f"/applications/{app_uuid}")
    if status >= 300:
        fail(f"failed to read app state for {app_uuid}")
    persisted = str(app_state.get("docker_compose_domains") or "")
    if fqdn not in persisted:
        print(f"ERROR: Coolify did not persist docker_compose_domains for {app_name}.",
              file=sys.stderr)
        print(f"       Expected to find: {fqdn}", file=sys.stderr)
        print(f"       Actually got:     {persisted or '<empty>'}", file=sys.stderr)
        print("", file=sys.stderr)
        print("Full app state for debugging:", file=sys.stderr)
        debug_keys = ("uuid", "name", "build_pack", "fqdn", "domains",
                      "docker_compose_domains", "docker_compose_location")
        debug = {k: app_state.get(k) for k in debug_keys if k in app_state}
        print(json.dumps(debug, indent=2), file=sys.stderr)
        print("", file=sys.stderr)
        print(f"Workaround: set Domain manually in Coolify UI for {app_name}.", file=sys.stderr)
        sys.exit(1)
    print(f"Domain persisted: {persisted}")

    print("Setting env vars...")
    set_env_var(app_uuid, "IMAGE_TAG_FRONTEND", opts["frontend_image"])
    set_env_var(app_uuid, "IMAGE_TAG_BACKEND", opts["backend_image"])
    set_env_var(app_uuid, "DATABASE_PASSWORD", os.environ["COOLIFY_PREVIEW_DB_PASSWORD"])
    set_env_var(app_uuid, "SECRET_KEY_BASE", os.environ["COOLIFY_PREVIEW_SECRET_KEY_BASE"])
    set_env_var(app_uuid, "COOLIFY_FQDN", fqdn)
    set_env_var(app_uuid, "MR_NUMBER", mr)

    trigger_deploy(app_uuid)

    print("")
    print(f"Preview URL: https://{fqdn}")
    print(f"Coolify app UUID: {app_uuid}")


def delete_preview(args):
    opts = parse_args(args, {"--mr": "mr"})

    require_env("COOLIFY_URL")
    require_env("COOLIFY_API_TOKEN")

    app_name = f"{APP_PREFIX}{opts['mr']}"
    app_uuid = find_app_uuid_by_name(app_name)

    if not app_uuid:
        print(f"App {app_name} not found in Coolify; nothing to delete (already cleaned up?)")
        return

    print(f"Deleting Coolify app: {app_name} (uuid: {app_uuid})")
    status, _ = api("DELETE", f"/applications/{app_uuid}?delete_volumes=true&docker_cleanup=true")
    if status >= 300:
        fail(f"delete failed for {app_uuid} (HTTP {status})")
    print("Deleted.")


def deploy_prod(args):
    opts = parse_args(args, {
        "--frontend-image": "frontend_image",
        "--backend-image": "backend_image",
    })

    require_env("COOLIFY_URL")
    require_env("COOLIFY_API_TOKEN")
    prod_uuid = require_env("COOLIFY_PROD_APP_UUID")

    print(f"Updating image tags on prod app: {prod_uuid}")
    set_env_var(prod_uuid, "IMAGE_TAG_FRONTEND", opts["frontend_image"])
    set_env_var(prod_uuid, "IMAGE_TAG_BACKEND", opts["backend_image"])
    trigger_deploy(prod_uuid)


USAGE = "Usage: coolify-preview.py {deploy-preview|delete-preview|deploy-prod} [args...]"

if len(sys.argv) < 2:
    print(USAGE, file=sys.stderr)
    print("See script docstring for required env vars.", file=sys.stderr)
    sys.exit(1)

cmd = sys.argv[1]
rest = sys.argv[2:]

if cmd == "deploy-preview":
    deploy_preview(rest)
elif cmd == "delete-preview":
    delete_preview(rest)
elif cmd == "deploy-prod":
    deploy_prod(rest)
else:
    print(f"Unknown command: {cmd}", file=sys.stderr)
    print(USAGE, file=sys.stderr)
    sys.exit(1)
