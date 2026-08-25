class UserDetail < ActiveRecord::Base
  self.primary_key = :id

  default_scope do
    where "email not in (:emails)",
      emails: [ 'root@endpointdev.com', 'timesheet@endpointdev.com', 'root@domain.com' ]
  end
end
