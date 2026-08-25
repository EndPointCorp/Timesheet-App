collection @charts
attributes :id, :display_label, :status, :parent_id, :dont_send_empty_reports
node :labels do |chart|
  chart.labels
end
