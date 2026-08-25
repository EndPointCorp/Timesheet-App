class Users::UpdateGroup < ActiveInteraction::Base
  integer :id
  string :group_entity
  object :user

  def execute
    @target_group = Role.find id
    JSON.parse(group_entity).each { |key, value|
      case key
      when "label"
        @target_group.display_label = value
        @target_group.save
      when "myroles"
        value.each { |role|
          if role['status'] == "add"
            tag_role=RoleHasRole.new
            tag_role.role_id = @target_group.id
            tag_role.has_role_id = role['id']
            tag_role.date_created = tag_role.last_modified = DateTime.now
            tag_role.created_by = tag_role.modified_by = user.role_id
            tag_role.save!
          elsif role['status'] == "remove"
            RoleHasRole.where(role_id: @target_group.id, has_role_id: role['id']).delete_all
          end
        }
      when "myrights"
        value.each { |right|
          if right['status'] == "add"
            tag_right = Right.new
            tag_right.role_id = @target_group.id
            tag_right.right_type_id = right['id']
            tag_right.is_granted = true
            tag_right.date_created = tag_right.last_modified = DateTime.now
            tag_right.created_by = tag_right.modified_by = user.role_id
            tag_right.save!
            if(right['targets'])
              right['targets'].each { |target|
                if target['status'] == "add"
                  tag_target = RightTarget.new
                  tag_target.right_id = tag_right['id']
                  tag_target.date_created = tag_target.last_modified = DateTime.now
                  tag_target.created_by = tag_target.modified_by = user.role_id
                  tag_target.ref_obj_pk = target['id']
                  tag_target.save!
                elsif target['status'] == "remove"
                  RightTarget.where(id: target['id']).try(:destroy_all)
                end
              }
            end
          elsif right['status'] == "update"
            right['targets'].each { |target|
              if target['status'] == "add"
                tag_target = RightTarget.new
                tag_target.right_id = right['id']
                tag_target.date_created = tag_target.last_modified = DateTime.now
                tag_target.created_by = tag_target.modified_by = user.role_id
                tag_target.ref_obj_pk = target['id']
                tag_target.save!
              elsif target['status'] == "remove"
                RightTarget.where(id: target['id']).try(:destroy_all)
              end
            } 
          elsif right['status'] == "remove"
            Right.where(id: right['id']).try(:destroy_all)
            if(right['targets'])
              right['targets'].each { |target|
                RightTarget.where(id: target['id']).try(:destroy_all)
              }
            end
          end
        }
      end   
    }
  end
end
