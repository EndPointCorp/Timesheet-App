class WorkChartKind < ActiveRecord::Base
  belongs_to :work_chart_kind_set, foreign_key: :work_chart_id, primary_key: :work_chart_id
  belongs_to :duration_kind, foreign_key: :kind_code, primary_key: :code

end
