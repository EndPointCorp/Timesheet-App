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
# The dev/test stack (and its Makefile) moved to the repo root; these targets
# delegate so `make test` keeps working from railsts/. See ../README.md.
.PHONY: test test-db coverage coverage-pdf

test-db:
	$(MAKE) -C .. test-db

test:
	$(MAKE) -C .. test

coverage:
	$(MAKE) -C .. coverage

# One-page shareable PDF summary (headline %, by-area table, biggest gaps),
# built from the last coverage run via Prawn (pure Ruby). Run `make
# coverage` first so coverage/.resultset.json exists.
coverage-pdf:
	cd .. && docker compose \
	    run --rm -e RAILS_ENV=test -e CONTAINER_ROLE=task backend \
	    bundle exec ruby script/coverage_summary.rb
	@echo "PDF generated: coverage/coverage_summary.pdf"
