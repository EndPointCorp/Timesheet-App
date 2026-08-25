class Users::UpdateUser < ActiveInteraction::Base
  integer :id
  string :user_entity
  object :user

  def execute
    @target_user = User.find id
    JSON.parse(user_entity).each { |key, value|
      case key
      when "name"
        @target_user.name = value
        @target_user.save
      when "email"
        @target_user.email = value
        @target_user.email = value
        @target_user.save
      when "password"
        @target_user.password = @target_user.password_confirmation = value
        @target_user.save
      when "status"
        if value
          @target_user.status_code = 'enabled'
        else
          @target_user.status_code = 'disabled'
        end
        @target_user.save
      when "time_zone"
        # Only accept a zone present in the master table (mirrors the
        # users.time_zone_code foreign key); the DB rejects anything else.
        if TimeZone.exists?(code: value)
          @target_user.time_zone_code = value
          @target_user.save
        else
          errors.add(:time_zone, "doesn't exist")
        end
      when "myteam"
        value.each { |team|
          if team['status'] == "add"
            tag_team=RoleHasRole.new
            tag_team.role_id = @target_user.role_id
            tag_team.has_role_id = team['id']
            tag_team.date_created = tag_team.last_modified = DateTime.now
            tag_team.created_by = tag_team.modified_by = user.role_id
            tag_team.save!
          elsif team['status'] == "remove"
            RoleHasRole.where(role_id: @target_user.role_id, has_role_id: team['id']).delete_all
          end
        }
      when "myroles"
        value.each { |role|
          if role['status'] == "add"
            tag_role=RoleHasRole.new
            tag_role.role_id = @target_user.role_id
            tag_role.has_role_id = role['id']
            tag_role.date_created = tag_role.last_modified = DateTime.now
            tag_role.created_by = tag_role.modified_by = user.role_id
            tag_role.save!
          elsif role['status'] == "remove"
            RoleHasRole.where(role_id: @target_user.role_id, has_role_id: role['id']).delete_all
          end
        }
      when "myrights"
        value.each { |right|
          if right['status'] == "add"
            tag_right = Right.new
            tag_right.role_id = @target_user.role_id
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
            rightToRemove = Right.find_by(id: right['id'], role_id: @target_user.role_id)
            if !rightToRemove
              errors.add(:user_entity, 'update failed: cannot delete an inherited right')
            else
              rightToRemove.try(:destroy)
              if(right['targets'])
                right['targets'].each { |target|
                  RightTarget.where(id: target['id']).try(:destroy_all)
                }
              end
            end
          end
        }
      end
    }
  end
end
