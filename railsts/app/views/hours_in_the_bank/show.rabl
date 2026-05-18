collection @budgets

attributes :work_chart_id

node :budget_chart_id do |budget|
  budget.work_chart_id
end

node :budget_chart_labels do |budget|
  budget.labels
end

node :mode do |budget|
  budget.kind_code
end

node :minutes_left do |budget|
  Interval.new(budget.hours_left).minutes
end

