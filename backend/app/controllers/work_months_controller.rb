# Serving monthly stats
class WorkMonthsController < ApplicationController
  before_action :ensure_logged_in
  respond_to :json

  # GET /work_months/:start/:end.json
  #
  # Returns monthly stats for months between given dates.
  def index
    user = if params[:username]
             Role.where(code: 'user_' + params[:username]).first.user
           else
             effective_user
           end

    start = Date.strptime(params[:start], '%Y-%m-%d')
    _end  = Date.strptime(params[:end], '%Y-%m-%d')
    @months = WorkMonth.find_by_range user, start, _end
    respond_with @months
  end
end
