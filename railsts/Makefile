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
