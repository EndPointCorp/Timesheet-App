# Mail delivery configuration, driven by env vars so each deploy environment
# (local dev, preview, production) can point at its own relay.
#
# MAILER_DELIVERY_METHOD=test switches to the in-memory test adapter — preview
# environments run with production data-shape but must never send real mail.
if ENV["MAILER_DELIVERY_METHOD"] == "test"
  ActionMailer::Base.delivery_method = :test
else
  ActionMailer::Base.smtp_settings = {
    address: ENV.fetch("SMTP_ADDRESS", "localhost"),
    port: ENV.fetch("SMTP_PORT", "25").to_i,
    user_name: ENV["SMTP_USERNAME"].presence,
    password: ENV["SMTP_PASSWORD"].presence,
    authentication: ENV["SMTP_AUTHENTICATION"].presence, # e.g. "plain"
    enable_starttls_auto: ENV.fetch("SMTP_ENABLE_STARTTLS", "false") == "true"
  }.compact
end

if Rails.env.development?
  begin
    APP_CONFIG = YAML.load_file("#{Rails.root}/config/local.yml")[Rails.env]
    Mail.register_interceptor(CampMailInterceptor)
  rescue
  end
end
