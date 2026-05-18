class PtosController < ApplicationController
  before_action :ensure_logged_in

  # GET /ptos
  def index
    user = if params[:username]
      Role.where(code: 'user_' + params[:username]).first.user
    else
      effective_user
    end

    render json: Pto.rundown_for(user, Date.today)
  end
end
