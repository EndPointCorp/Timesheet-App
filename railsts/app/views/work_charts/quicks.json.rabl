def formatted_charts(charts)
  charts.map do |chart|
    {
      id: chart.id,
      status: chart.tree_status,
      parent_id: chart.parent_id,
      labels: chart.labels.drop(1)
    }
  end
end

node :clients do
  formatted_charts @charts.where("'Clients' = any(labels)")
end

node :others do
  formatted_charts @charts.where("'Clients' != all(labels)")
end
