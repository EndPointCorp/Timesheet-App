class HoursInTheBank::HistoryBudget < ActiveRecord::Base
  self.table_name = :all_hours_in_the_bank

  belongs_to :chart_label, foreign_key: :work_chart_id
end


