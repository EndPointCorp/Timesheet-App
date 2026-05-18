collection @days
attributes :has_zero, :time, :billable_time, :nonbillable_time, :pto_time,
  :has_entries, :has_redundant_entries
node :date do |day|
  day.date.to_s[0..9]
end
