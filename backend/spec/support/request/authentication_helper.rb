module AuthenticationHelper

  # goes through a successful process of logging in to the 
  # system through api
  def login_sucessfully(email="correct@example.com")
    post user_session_path, params: { user: { email: email, password: "correct" } }, xhr: true
    ret = %({"success":true,"redirect":"/"})
    response.body.should be_json_eql(ret)
  end

  # attempts to log out, forces the @current_user to be nil
  # in order to log a user out so other users can log in
  def logout_sucessfully
    delete destroy_user_session_path
    @current_user = nil
  end

  def create_team(code)
    FactoryBot.create :role, code: "team_#{code}"
  end

  def create_correct_user(email = "correct@example.com", options = {})
    @current_user = FactoryBot.create :user, email: email,
      name: email.split('@').first,
      password: 'correct',
      password_confirmation: 'correct'
    if options[:roles]
      options[:roles].each do |role_name|
        role = Role.where(code: role_name).first
        @current_user.role.roles << role
      end
    end
    if options[:rights]
      options[:rights].each do |name, targets|
        type = RightType.where(code: name.to_s).first
        if type
          right = FactoryBot.create :right, role_id: @current_user.role.id, right_type_id: type.id
          if targets.is_a?(Array)
            targets.each do |target|
              FactoryBot.create :right_target, ref_obj_pk: target.values.first,
                right_id: right.id, date_created: DateTime.now.to_date
            end
          end
        else
          raise ArgumentError, "Couldn't find right type - #{name}"
        end
      end
    end
    @current_user
  end

  def grant_superuser
    Role.any_instance.
      stubs(:has_right_to).
      with(RightType::SUPERUSER).
      returns(true)
  end
  def grant_manage_workcharts
    Role.any_instance.
      stubs(:has_right_to).
      with(RightType::MANAGE).
      returns(true)
  end
  def grant_manage_users
    Role.any_instance.
      stubs(:has_right_to).
      with(RightType::CREATE_USERS).
      returns(true)
  end

end
