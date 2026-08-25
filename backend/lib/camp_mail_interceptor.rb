class CampMailInterceptor
    def self.delivering_email(message)
      message.subject = "Intercepted Email [ to: #{message.to}, cc: #{message.cc}, bcc: #{message.bcc} ] #{message.subject}"
      message.to = APP_CONFIG['intercept_mail_to']
      message.cc = []
      message.bcc = []
    end
end
