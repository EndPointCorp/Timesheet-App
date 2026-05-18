class HoursInTheBank::Budget < ActiveRecord::Base
  self.table_name = :hours_in_the_bank

  belongs_to :chart_label, foreign_key: :work_chart_id
  belongs_to :work_chart, foreign_key: :work_chart_id
end

