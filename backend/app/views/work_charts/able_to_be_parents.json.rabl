collection @charts
attributes :id, :display_label, :status, :parent_id

node :path do |chart|
  chart.labels #.gsub(/[\{\}\"]/, '').gsub(',', ' - ')
end
