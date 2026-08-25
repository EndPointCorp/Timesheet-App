class ReviewingFlow
  FLOW = [ :owner, [ [ :project_manager, :team_manager ], :global_reviewer ] ]

  def self.next(entry, _user)
    # fetching specifically this user for the case when we're in the 
    # assumed user mode:
    user = User.where(role_id: _user.role_id).first
    _index = next_index(entry, user)

    (_index..(FLOW.count - 1)).to_a.lazy.map do |index|
      users_for_index(index, entry, user)
    end.find do |arr|
      !arr.empty?
    end || []
  end

  def self.previous(entry, user)
    index = previous_index(entry, user)
    users_for_index(index, entry, user, true)
  end

  def self.approved_ids(entry)
    entry.approvals.where(approved: true).
      select(:role_id).map(&:role_id).uniq
  end

  def self.next_index(entry, user)
    current_index(entry, user) + 1
  end

  def self.previous_index(entry, user)
    current_index(entry, user) - 1
  end

  def self.current_index(entry, user)
    _user_class = user_class(entry, user)
    FLOW.index do |i|
      if i.is_a? Array
        found = false
        i.each do |i_sub|
          found = if i_sub.is_a? Array
                    i_sub.include? _user_class
                  else
                    i_sub == _user_class
                  end
        end

        found
      else
        i == _user_class
      end
    end || -1
  end

  def self.user_class(entry, user)
    if entry.role_id == user.role_id
      :owner
    elsif entry.work_chart.project_managers.map(&:role_id).include? user.role_id
      :project_manager
    elsif entry.owner.team_managers.map(&:role_id).include? user.role_id
      :team_manager
    elsif user.role.has_right_to(RightType::GLOBAL_REVIEWER)
      :global_reviewer
    else
      :not_relevant
    end
  end

  def self.users_for_index(index, entry, user, all = false)
    _aids  = approved_ids(entry)
    _current_index = current_index(entry, user)
    _current_reviewers = if _current_index == index
      [ ]
    else
      users_for_index(current_index(entry, user), entry, user).map(&:id)
    end
    _user_class = FLOW[index]
    arr = if _user_class.is_a? Array
      _user_class.lazy.map do |_class|
        if _class.is_a? Array
          res = []

          _class.each do |sub_class|
            subclass_users = users_for_class(sub_class, entry, user)

            already_in_process = subclass_users.select do |u|
              _aids.include?(u.role_id)
            end

            break unless already_in_process.empty?

            subclass_users.select! do |u|
              !_aids.include?(u.role_id) && !_current_reviewers.include?(u.id)
            end

            unless subclass_users.empty?
              res = subclass_users
              break
            end
          end

          res
        else
          users_for_class(_class, entry, user)
        end
      end.select { |u| !u.nil? && !u.empty? }.to_a || []
    else
      users = users_for_class(_user_class, entry, user)
      users.nil? ? [] : [ users ]
    end.lazy.map do |_users|
      if all
        _users
      else
        _users.select do |u|
          !_aids.include?(u.role_id) && !_current_reviewers.include?(u.id)
        end
      end
    end
    arr.select { |u| !u.empty? }.first || []
  end

  def self.users_for_class(_class, entry, user)
    case _class
      when :owner then [ entry.role.user ]
      when :project_manager then entry.work_chart.project_managers.to_a
      when :team_manager then user.team_managers.to_a
      when :global_reviewer then
        if entry.role.user.is_director? ||
            User.global_reviewers.where(id: entry.role.user.id).count > 0
          nil
        else
          User.global_reviewers.to_a
        end
      else
        nil
    end
  end
end
