class TimeZonesController < ApplicationController
  before_filter :ensure_logged_in

  #GET /time_zones
  def index
    render json: User.select("DISTINCT(time_zone_code)").map(&:time_zone_code).to_json
  end
end
