class UserDetail < ActiveRecord::Base
  self.primary_key = :id

  default_scope do
    where "email not in (:emails)",
      emails: SYSTEM_ACCOUNT_EMAILS
  end
end
