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
    user = user_from_username_param
    return return_401 if user.nil?

    @days = WorkDay.by_year_and_month(user, params[:year], params[:month])
    respond_with @days
  end
end
