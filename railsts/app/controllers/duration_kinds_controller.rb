class DurationKindsController < ApplicationController
  respond_to :json
  before_action :ensure_logged_in

  # GET /duration_kinds.json
  #
  # Used by charts editor. Returns all available duration kinds.
  def index
    @kinds = DurationKind.where(status: 1).order(:production_category_id)
			 .select([:code, :display_label])
    respond_with @kinds
  end
end

