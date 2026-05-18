module ReportsHelper

  def last_month_params_for(users)
    { 
      roles: users.map(&:email), 
      start: 1.month.ago, 
      end: 0.months.ago 
    }
  end

  def create_users_and_set_report_rights(options = {})
    count                = options[:count] ||= 5
    current_is_superuser = options[:current_is_superuser] ||= false
    deny_access_for      = options[:deny_access_for] ||= 1
    threshold            = -1*deny_access_for - 1

    users = FactoryGirl.create_list :user, count
    Role.any_instance.
      stubs(:has_right_to).
      with(RightType::SUPERUSER).
      returns(current_is_superuser)
    users[0..threshold].each do |user|
      set_rights_on_user_for 'report', user, true
    end
    users[(threshold + 1)..-1].each do |user|
      set_rights_on_user_for 'report', user, false
    end if deny_access_for != 0
    if @effective_user
      set_rights_on_user_for 'report', @effective_user, true
    end
    users
  end

  def set_rights_on_user_for(right, user, grant)
    Role.any_instance.
      stubs(:has_right_to).
      with(right, responds_with(:id, user.role.id)).
      returns(grant)
  end
  
end
