# Serving work days
class WorkDaysController < ApplicationController
  before_action :ensure_logged_in
  respond_to :json

  # GET /work_days/calendar/:year/:month.json
  #
  # Returns all days needed to render calendar, including
  # last days of the month before and first days of the month
  # after.
  def calendar
    user = if params[:username]
             Role.where(code: 'user_' + params[:username]).first.user
           else
             effective_user
           end

    @days = WorkDay.by_year_and_month(user, params[:year], params[:month])
    respond_with @days
  end
end
