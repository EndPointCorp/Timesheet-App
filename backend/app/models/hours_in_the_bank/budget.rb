class HoursInTheBank::Budget < ActiveRecord::Base
  self.table_name = :hours_in_the_bank
  # View has no primary key; Rails 8 needs an order for .first. The (work_chart_id,
  # kind_code) filter returns one budget, so this column only satisfies Rails.
  self.implicit_order_column = "work_chart_id"

  belongs_to :chart_label, foreign_key: :work_chart_id
  belongs_to :work_chart, foreign_key: :work_chart_id
end

