class Team < ActiveRecord::Base
  self.primary_key = :role_id

  def self.by_user(user)
    Team.where "(teams.users->'#{user.role.code}') is not null"
  end

  def self.by_manager(user)
    if has_manager_code?
      Team.where manager_code: user.role.code
    else
      Team.where "(teams.managers->'#{user.role.code}') is not null"
    end
  end

  def manager_code
    if Team.has_manager_code?
      self[:manager_code]
    else
      self[:managers].try(:keys).try(:first)
    end
  end

  def members
    Role.where code: self.users.keys
  end

  def self.has_manager_code?
    Team.columns.map(&:name).include?("manager_code")
  end

  def manager
    Role.where(code: self.manager_code).first.try(:user)
  end

  def name
    self.display_label
  end

  def self.set_team_nag_email_recipient(user_email, team)
    role = User.find_by_email(user_email).role
    team = Role.find_by_display_label(team.capitalize)
    raise "#{team} is not a valid team because it doens't have a role." unless team
    right_type = RightType.find_by_display_label "Get nag emails for team"
    right = Right.create!(role_id: role.id, right_type_id: right_type.id, date_created: DateTime.now, is_granted: false)
    right.targets.create!(ref_obj_pk: team.id.to_s, date_created: DateTime.now)
  end
end
