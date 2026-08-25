collection @totals
attributes :code, :team_code, :team_display_label, :date_performed
node :durations do |day|
  day.durations.inject({}) { |hash, (k,v)| hash.merge(k => Interval.new(v)) }
end
