# Be sure to restart your server when you modify this file.
#
# secret_key_base signs/encrypts cookies, including the session-id cookie
# (sessions themselves live in the DB via activerecord-session_store).
# Real deployments inject it via the SECRET_KEY_BASE env var (generate one
# with `bin/rails secret`); rotating it signs every user out but loses no data.
TimesheetApp::Application.config.secret_key_base =
  ENV["SECRET_KEY_BASE"].presence ||
  begin
    raise "SECRET_KEY_BASE must be set in production" if Rails.env.production?

    # Fixed insecure fallback for development/test only.
    "insecure-dev-and-test-only-secret-key-base-0123456789abcdef0123456789"
  end
