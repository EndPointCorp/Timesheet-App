.PHONY: dev dev-build dev-down dev-clean dev-config preview-config logs test test-db coverage check-env

check-env:
	@test -f .env || { echo "Missing .env — run: cp .env.example .env"; exit 1; }

# --- Development -------------------------------------------------------

dev: check-env
	docker compose up -d

dev-build: check-env
	docker compose up -d --build

dev-down:
	docker compose down

dev-clean:
	docker compose down -v

dev-config:
	docker compose config

preview-config:
	MR_NUMBER=0 IMAGE_TAG_FRONTEND=frontend:example IMAGE_TAG_BACKEND=backend:example \
	DATABASE_PASSWORD=example SECRET_KEY_BASE=example COOLIFY_FQDN=mr-0.example.test \
	docker compose -f docker-compose.preview.yml config

logs:
	docker compose logs -f

# --- Tests -------------------------------------------------------------

test-db: check-env
	docker compose up -d db
	until docker compose exec -T db pg_isready -U timesheet >/dev/null 2>&1; do sleep 1; done
	docker compose run --rm -e RAILS_ENV=test -e CONTAINER_ROLE=task backend bundle exec rake db:test:setup

test: check-env
	docker compose run --rm -e RAILS_ENV=test -e CONTAINER_ROLE=task backend bundle exec rspec

coverage: check-env
	docker compose run --rm -e RAILS_ENV=test -e CONTAINER_ROLE=task -e COVERAGE=true backend bundle exec rspec
	@echo "Coverage report generated: open backend/coverage/index.html in a browser"
