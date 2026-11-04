class ApplicationMailer < ActionMailer::Base
  default from: MAILER_FROM_EMAIL
  layout 'mailer'
end
