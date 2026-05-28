FONT_DIR      ?= ./public/fonts/Timesheet
FONTELLO_HOST ?= http://fontello.com

fontellodotfile:
	curl --silent --show-error --fail --output .fontello \
	    --form "config=@${FONT_DIR}/config.json" \
	    ${FONTELLO_HOST}

fontsave: fontellodotfile
	@if test ! -e .fontello ; then \
	    echo 'Run `make fontopen` first.' >&2 ; \
	    exit 128 ; \
	    fi
	rm -rf .fontello.src .fontello.zip
	curl --silent --show-error --fail --output .fontello.zip \
	    ${FONTELLO_HOST}/`cat .fontello`/get
	unzip .fontello.zip -d .fontello.src
	rm -rf ${FONT_DIR}
	mv `find ./.fontello.src -maxdepth 1 -name 'fontello-*'` ${FONT_DIR}
	rm -rf .fontello.src .fontello.zip
	find public/fonts/Timesheet/ -name '*.css' | xargs sed -i "s/\.\.\/font/\/fonts\/Timesheet\/font/g"

check_ruby_syntax:
	find . -name '*.rb' -exec echo {} \; -exec ruby -c {} \; | grep -C 4 "syntax error"

# --- Test suite -------------------------------------------------------
# Runs against an isolated test DB (timesheet_test, per config/database.yml) so
# dev data is never touched. Run `make test-db` once after cloning (or to reset),
# then `make test`. See the README.
.PHONY: test test-db

TEST_RUN = docker compose run --rm -e RAILS_ENV=test

# One-time (idempotent) test-DB setup: create the DB, load db/structure.sql, and
# populate the materialized views the suite depends on.
test-db:
	docker compose up -d db
	until docker compose exec -T db pg_isready -U timesheet -d timesheet >/dev/null 2>&1; do sleep 1; done
	$(TEST_RUN) web bundle exec rake db:test:setup

test:
	$(TEST_RUN) web bundle exec rspec
