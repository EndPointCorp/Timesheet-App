class SettingsController < ApplicationController  
  # GET /
  def index
    @settings = Settings.instance.client

    render json: JSON.dump(@settings)
  end
end
