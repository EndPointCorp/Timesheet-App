class RightTypesController < ApplicationController
  before_action :ensure_logged_in

  def all
    @right_types = RightType.select('display_label as label, id, code as value, code, target_kind_code').sort
    render json: @right_types
  end
end
