# Rails API image. See compose.yml at the repo root.
#
# Ruby version matches .ruby-version and the `ruby` line in the Gemfile. Bump
# one, bump all three.
FROM ruby:3.3.6-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      libyaml-dev \
      git \
      # wkhtmltopdf-binary ships its own binary, and these are the three shared
      # libraries it links (confirmed with ldd; nothing else is missing). Leave
      # them out and PDF reports fail when they render, not when you build.
      libxrender1 \
      libfontconfig1 \
      libjpeg62-turbo \
    && rm -rf /var/lib/apt/lists/*

# Run as a normal user, not root. The ruby image has no non-root user, so make
# one and give it the gem directory. 1000 is the first real user on almost any
# Linux desktop, which keeps bind-mounted file ownership sane there. macOS and
# Windows remap ownership anyway, so it does not matter on those.
#
# The home directory is deliberately NOT /app. /app is your checkout, mounted in,
# and anything that writes to ~ (wkhtmltopdf builds a fontconfig cache, for one)
# would drop files straight into your source tree.
RUN groupadd -g 1000 app \
 && useradd --create-home --home-dir /home/app --shell /bin/bash --uid 1000 -g app app \
 && mkdir -p /app \
 && chown -R app:app /app /usr/local/bundle

WORKDIR /app
USER app

# Gems live at /usr/local/bundle, outside /app, so the compose bind mount over
# /app does not hide them. Change the Gemfile and you need a rebuild.
COPY --chown=app:app Gemfile Gemfile.lock ./
RUN gem install bundler -v 2.5.22 \
 && bundle install

COPY --chown=app:app . .

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]