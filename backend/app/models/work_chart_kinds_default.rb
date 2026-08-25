class WorkChartKindsDefault < ActiveRecord::Base
  # TODO: make a relation here once it become clear on "what for?"
  # belongs_to :work_chart_kind, foreign_key: :work_chart_id, primary_key: :work_chart_id, conditions: Proc.new { |d| {kind_code: d.kind_code} }
end
