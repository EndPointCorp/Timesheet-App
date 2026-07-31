class TimeZonesController < ApplicationController
  before_action :ensure_logged_in

  #GET /time_zones
  def index
    # utc_offset is a DB numeric; coerce to a number so the JSON carries a
    # number (e.g. -5) and not a quoted decimal string, which the frontend
    # offset label check relies on.
    zones = TimeZone.visible.map { |tz| { code: tz.code, utc_offset: tz.utc_offset.to_f } }
    render json: zones
  end
end
