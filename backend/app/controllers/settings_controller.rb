class SettingsController < ApplicationController  
  # GET /
  def index
    @settings = Settings.instance.client

    render json: @settings
  end
end
