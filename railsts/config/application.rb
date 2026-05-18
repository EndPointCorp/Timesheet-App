require File.expand_path('../boot', __FILE__)

require "active_record/railtie"
require "action_controller/railtie"
require "action_mailer/railtie"
require "sprockets/railtie"

Bundler.require(*Rails.groups)
Dotenv::Railtie.load if Rails.env != 'production'

module TimesheetApp
  class Application < Rails::Application

    config.generators do |g|
      g.view_specs false
      g.helper_specs false
    end


    config.autoload_paths += %W(#{config.root}/lib)
    config.autoload_paths += %W(#{config.root}/lib/accounting)
    config.autoload_paths += %W(#{config.root}/app/interactions)

    config.i18n.enforce_available_locales = true
    config.cache_store = :memory_store
    config.active_job.queue_adapter = :delayed_job
    config.encoding = "utf-8"
    config.filter_parameters += [:password, :password_confirmation]
    config.active_support.escape_html_entities_in_json = true
    config.action_dispatch.session_store = :active_record_store  
    config.assets.enabled = false

    config.middleware.delete "Rack::MethodOverride"
    config.middleware.delete "ActionDispatch::RequestId"

    config.active_record.schema_format = :sql
  end
end
