collection @entries

attributes :name, :duration_kind

node :date_performed do |entry|
  entry.date
end

node :duration do |entry|
  Interval.new(entry.duration).minutes
end

node :kind do |entry|
  entry.kind_code.split(/_/).first
end
