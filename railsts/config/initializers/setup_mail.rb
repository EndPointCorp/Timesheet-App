ActionMailer::Base.smtp_settings = {
  address: "localhost",
  port: 25,
  enable_starttls_auto: false
}

if Rails.env.development?
  begin
    APP_CONFIG = YAML.load_file("#{Rails.root}/config/local.yml")[Rails.env]
    Mail.register_interceptor(CampMailInterceptor)
  rescue
  end
end
