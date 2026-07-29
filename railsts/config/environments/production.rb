require "#{Rails.root}/lib/instance_info"

TimesheetApp::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # Code is not reloaded between requests
  config.enable_reloading = false
  config.eager_load = true

  # Full error reports are disabled and caching is turned on
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true

  # Disable Rails's static asset server (nginx serves the SPA and owns the edge)
  config.public_file_server.enabled = false

  # TLS terminates at Coolify/Traefik, which forwards plain HTTP plus
  # X-Forwarded-Proto: https. assume_ssl makes Rails treat those requests as
  # secure; force_ssl keeps secure cookies + HSTS + redirects for anything
  # that reaches the app as real HTTP. The container healthcheck curls
  # http://localhost:3000/up directly, so exclude it from the redirect.
  config.assume_ssl = true
  config.force_ssl = true
  config.ssl_options = { redirect: { exclude: ->(request) { request.path == "/up" } } }

  # Log to STDOUT for container log capture
  config.logger = ActiveSupport::TaggedLogging.logger(STDOUT)
  config.log_tags = [ :request_id ]
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.silence_healthcheck_path = "/up"

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation can not be found)
  config.i18n.fallbacks = true

  # Send deprecation notices to registered listeners
  config.active_support.deprecation = :notify

  config.action_mailer.default_url_options = { host: InstanceInfo.base_url }
  # ActionMailer Config
  # Setup for production - deliveries, no errors raised
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = false
  config.action_mailer.default charset: "utf-8"
end
