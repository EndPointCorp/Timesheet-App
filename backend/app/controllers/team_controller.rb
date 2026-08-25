class TeamController < ApplicationController
  before_action :ensure_logged_in

  def totals
    @totals = DayWorkTotal.where('date_performed >= ? AND date_performed <= ?', params[:from], params[:to])
  end

  def teams
    render json: (Team.all.map do |t|
      {
        role_id: t.role_id,
        code: t.code,
        display_label: t.display_label,
        manager_code: t.manager_code,
        users: t.users
      }
    end)
  end
end
