class PtosController < ApplicationController
  before_action :ensure_logged_in

  # GET /ptos
  def index
    user = user_from_username_param
    return return_401 if user.nil?

    render json: Pto.rundown_for(user, Date.today)
  end
end
