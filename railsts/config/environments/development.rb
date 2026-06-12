require "#{Rails.root}/lib/instance_info" 

TimesheetApp::Application.configure do

  # config.force_ssl = true

  # Settings specified here will take precedence over those in config/application.rb

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Log error messages when you accidentally call methods on nil.
  config.whiny_nils = true

  # Show full error reports and disable caching
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = true

  # ActionMailer Config
  config.action_mailer.default_url_options = { host: 'localhost:3000' }
  #config.action_mailer.delivery_method = :smtp
  config.action_mailer.delivery_method = :sendmail
  # change to true to allow email to be sent during development
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.default charset: "utf-8"

  # Print deprecation notices to the Rails logger
  config.active_support.deprecation = :log

  # Only use best-standards-support built into browsers
  config.action_dispatch.best_standards_support = :builtin

  # Raise exception on mass assignment protection for Active Record models

  # ActiveSupport::Logger (not plain Logger) so it has #silence. Rails 7.1+ stopped
  # monkey-patching ::Logger with silence, and activerecord-session_store calls
  # logger.silence on the AR logger for every session lookup.
  config.active_record.logger = ActiveSupport::Logger.new(File.join(Rails.root, 'log', 'activerecord.log'))

  config.eager_load = false

  config.action_mailer.default_url_options = { host: InstanceInfo.base_url }

  config.action_mailer.delivery_method = :smtp
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.default charset: "utf-8"
end
