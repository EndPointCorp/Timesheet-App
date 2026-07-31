# Timesheet frontend

This is the timesheet app's frontend, written with React (created using the now-deprecated [Create React App](https://github.com/facebook/create-react-app)).

## Running the development server

The whole stack — this frontend, the Rails API, and Postgres — starts with `make dev-build` from the repo root. See the [root README](../README.md). That stack serves a compiled bundle through nginx on <http://localhost:8080>, so it does not hot-reload.

To run the dev server on your machine instead, with hot reload:

```bash
npm install
npm run start
```

It serves <http://localhost:3000> and forwards `/api` to <http://localhost:8088>, which is where the compose stack publishes the API — so it works against a containerised backend with no extra setup. The target is the `proxy` field in `package.json`.

## Building for a camp

To build for a camp, run `bin/deploy-camp.sh -u <camp server username> -n <camp number>`.

## Building for production

Production builds are handled via a GitLab CI pipeline, defined in `.gitlab-ci.yml`.

## Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

### Prerequisites

```bash
# Install dependencies (if not already done)
npm install

# Install Playwright browsers (first time only)
npx playwright install
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run tests with visible browser
npx playwright test --headed

# Run a specific test file
npx playwright test tests/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "login"

# Run with detailed output
npx playwright test --reporter=list
```

### Test Structure

```text
tests/
├── helpers/
│   ├── api.ts           # API helpers for test data seeding
│   └── test-utils.ts    # Shared utilities (login, navigation)
├── auth.spec.ts         # Authentication tests
├── calendar.spec.ts     # Calendar navigation tests
├── entry.spec.ts        # Entry edit/delete tests
├── new-entry.spec.ts    # New entry form tests
├── reports.spec.ts      # Reports page tests
└── today.spec.ts        # Today panel tests
```

### Environment Variables

Tests use environment variables for configuration. Copy `.env.example` to `.env` and set your test credentials:

- `E2E_EMAIL` - Test user email
- `E2E_PASSWORD` - Test user password
- `BASE_URL` - App URL (default: `http://localhost:3000`)
- `API_BASE_URL` - API URL (default: `http://localhost:3000/api/`)

### Debugging

```bash
# Run with Playwright inspector
npx playwright test --debug

# View test report after run
npx playwright show-report
```

## Formatting

This project uses Prettier to format files. Please format all files using the version of Prettier specified in package-lock.json before committing: run `npx prettier --write <files>` from the command line, or use an extension like prettier-vscode which uses the project version.
