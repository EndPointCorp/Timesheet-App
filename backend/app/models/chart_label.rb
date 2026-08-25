class ChartLabel < ActiveRecord::Base
  self.primary_key = :id

  has_many :work_entries, foreign_key: :work_chart_id, primary_key: :id

  has_many :transactions_in_path, -> (chart_label) {
    joins('INNER JOIN chart_labels ON transactions.work_chart_id = ANY(chart_labels.ids)').
      where('chart_labels.id = :id', id: chart_label.id)
  }, foreign_key: :work_chart_id, class_name: "Transaction"

end
