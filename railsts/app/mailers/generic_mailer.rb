class GenericMailer < ApplicationMailer
  layout false

  def email(options)
    @html = options[:html].html_safe
    @text = options[:text]
    headers['Return-Path'] = options[:headers]['Return-Path']
    mail options.slice(:to, :bcc, :subject, :return_path, :reply_to).
      merge({ from: MAILER_FROM_EMAIL }).
      merge(options[:headers] || {})
  end

end
