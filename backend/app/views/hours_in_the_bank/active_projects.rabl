collection @budgets

node :project_id do |budgets|
  budgets.work_chart_id
end

node :project_labels do |budgets|
  budgets.budgets.first.labels
end

node :budgets do |budgets|
  budgets.budgets.map do |budget|
    {
      mode: budget.kind_code,
      minutes_left: budget.hours_left.present? ? Interval.new(budget.hours_left).minutes : nil
    }
  end
end
