class TeamController < ApplicationController
  before_action :ensure_logged_in

  # GET /team/totals
  #
  # Daily totals for the people the caller is allowed to see. This used to
  # filter on the date range only, which handed every user's hours to anyone
  # who asked.
  def totals
    @totals = DayWorkTotal.where('date_performed >= ? AND date_performed <= ?', params[:from], params[:to])
    @totals = @totals.where(code: visible_user_codes) unless effective_user.is_admin?
  end

  # GET /team/teams
  #
  # Used by the calendar to build its "Calendar for user" list, so returning
  # every team here is what put strangers in that dropdown.
  def teams
    render json: (visible_teams.map do |t|
      {
        role_id: t.role_id,
        code: t.code,
        display_label: t.display_label,
        manager_code: t.manager_code,
        users: t.users
      }
    end)
  end

  private

  # You can see a team you manage and a team you are in. Admins see all, which
  # is what is_admin? already means everywhere else in this codebase.
  def visible_teams
    return Team.all.to_a if effective_user.is_admin?

    (Team.by_manager(effective_user).to_a + Team.by_user(effective_user).to_a).uniq(&:role_id)
  end

  # Always includes the caller, so someone in no team still sees their own row.
  def visible_user_codes
    (visible_teams.flat_map { |t| t.users.keys } + [effective_user.role.code]).uniq
  end
end
