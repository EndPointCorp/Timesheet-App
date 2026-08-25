class WorkChartKindSet < ActiveRecord::Base
  belongs_to :work_chart
  has_many :work_chart_kinds, foreign_key: :work_chart_id, primary_key: :work_chart_id

end
