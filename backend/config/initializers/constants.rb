MAILER_FROM_EMAIL = ENV['MAILER_FROM_EMAIL'] || 'timesheet@example.com'
# Accounts the app itself uses. They are not people, so they are left out of
# the user lists. Comma separated.
SYSTEM_ACCOUNT_EMAILS = (ENV['SYSTEM_ACCOUNT_EMAILS'] || 'root@example.com,timesheet@example.com,root@domain.com').split(',').map(&:strip)
# People's addresses are name@EMAIL_DOMAIN. Only the console shortcut
# User.by_name uses this.
EMAIL_DOMAIN = ENV['EMAIL_DOMAIN'] || 'example.com'
MAILER_USER_REPORT_FILLED_BCC_RECIPIENTS = ENV['MAILER_USER_REPORT_FILLED_BCC_RECIPIENTS'] || ''
MAILER_USER_REPORT_EMPTY_BCC_RECIPIENTS = ENV['MAILER_USER_REPORT_EMPTY_BCC_RECIPIENTS'] || ''
WORK_CHART_ROOT_ID = ENV['WORK_CHART_ROOT_ID'] || 1
WORK_CHART_CLIENTS_ID = ENV['WORK_CHART_CLIENTS_ID'] || 2
TEAM_ROLE_ID = ENV['TEAM_ROLE_ID'] || 7
