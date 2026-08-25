class WorkCharts::EnsureDurationKindExists < ActiveInteraction::Base
  string :display_label, :code, :abbr_label
  object :user

  def execute
    existing || newly_created
  end

  def existing
    @_existing ||= DurationKind.where(code: code).first
  end

  def newly_created
    @_newly_created ||= DurationKind.create! code: code, date_created: DateTime.now,
      created_by: user.role_id, last_modified: DateTime.now,
      modified_by: user.role_id, display_label: display_label,
      abbr_label: abbr_label, production_category_id: 1, status: 1
  end
end
