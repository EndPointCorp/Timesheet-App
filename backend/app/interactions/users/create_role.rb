class Users::CreateRole < ActiveInteraction::Base
  
  string :label, :code, :description

  object :user

  def execute
    Role.transaction do
      role = Role.new
      role.date_created = role.last_modified = DateTime.now
      role.display_label = label 
      role.code = code
      role.description = description
      role.created_by = role.modified_by = user.role_id
      role.save!
      role 
    end
  end

end
