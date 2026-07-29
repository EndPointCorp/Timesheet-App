# syntax=docker/dockerfile:1
# check=error=true

# Backend image for the timesheet Rails 8 API.
#
# Stages:
#   base  — slim Ruby + everything the app needs at runtime
#   build — compiles gems (production image ingredients)
#   dev   — full toolchain + all gem groups; local `make dev` / `make test` target
#   final — (default) production image: non-root, puma on :3000

ARG RUBY_VERSION=3.3.6
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

WORKDIR /rails

# Runtime packages:
# - postgresql-client-16 (PGDG, not Debian's 15): the entrypoint uses
#   pg_isready/psql, and db:prepare loads db/structure.sql whose pg_dump-16
#   \restrict meta-commands old psql minors can't parse (see railsts/Rakefile).
# - zstd: restores the preview seed dump (/seed/*.sql.zst).
# - libxrender1 libxext6 libfontconfig1 fontconfig fonts-dejavu-core
#   libjpeg62-turbo: shared libs + fonts wkhtmltopdf-binary needs for the
#   PDF reports (verify with ldd against the gem's debian_12 binary).
# - libjemalloc2: allocator (memory/latency); curl: container healthchecks.
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl ca-certificates && \
    . /etc/os-release && \
    curl -fsSL -o /etc/apt/keyrings/pgdg.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc && \
    echo "deb [signed-by=/etc/apt/keyrings/pgdg.asc] http://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      postgresql-client-16 zstd libjemalloc2 \
      libxrender1 libxext6 libfontconfig1 fontconfig fonts-dejavu-core libjpeg62-turbo && \
    ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV BUNDLE_PATH="/usr/local/bundle" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"

# ---------------------------------------------------------------------------
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_WITHOUT="development test"

COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

COPY . .

# ---------------------------------------------------------------------------
# Dev/test image: all gem groups (rspec, dotenv, ...) plus build tools so
# `bundle install` works in-container. `make dev` bind-mounts the source over
# /rails; `make test` runs rspec in it. Runs as root on purpose (bind mounts).
FROM base AS dev

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV RAILS_ENV="development"

COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache

COPY . .

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
EXPOSE 3000
CMD ["./bin/rails", "server", "-b", "0.0.0.0"]

# ---------------------------------------------------------------------------
# Production image (default build target)
FROM base

# The SPA sends every request through nginx; clients cache-bust on the
# Front-Version response header, which ApplicationController reads from this
# file on each request. CI bakes the commit SHA in (--build-arg APP_VERSION).
ARG APP_VERSION=dev

COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

RUN echo "${APP_VERSION}" > public/front.version && \
    groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    mkdir -p log tmp && \
    chown -R rails:rails /rails/log /rails/tmp

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_WITHOUT="development test"

USER 1000:1000

# Prepares/migrates the DB when CONTAINER_ROLE=web; see bin/docker-entrypoint.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 3000
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
