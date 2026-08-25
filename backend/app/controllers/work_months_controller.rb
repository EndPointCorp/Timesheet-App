# Serving monthly stats
class WorkMonthsController < ApplicationController
  before_action :ensure_logged_in
  respond_to :json

  # GET /work_months/:start/:end.json
  #
  # Returns monthly stats for months between given dates.
  def index
    user = user_from_username_param
    return return_401 if user.nil?

    start = Date.strptime(params[:start], '%Y-%m-%d')
    _end  = Date.strptime(params[:end], '%Y-%m-%d')
    @months = WorkMonth.find_by_range user, start, _end
    respond_with @months
  end
end
