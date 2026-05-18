collection @results
attributes :id

node :label do |result|
  result.labels.drop(1).join(' - ')
end

node :value do |result|
  result.labels.drop(1).join(' - ')
end
