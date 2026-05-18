class RoleHasRole < ActiveRecord::Base
  self.table_name = :roles_has_roles

  before_create lambda { |r|
    r.date_created = r.last_modified = DateTime.now
  }

  belongs_to :role,
    foreign_key: :has_role_id,
    class_name: 'Role'

  belongs_to :owner,
    foreign_key: :role_id,
    class_name: 'Role'
end
