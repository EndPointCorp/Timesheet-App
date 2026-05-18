collection @days
attributes :date
node :time do |day|
  "#{'%02d' % day.time.hour}:#{'%02d' % day.time.min}:00"
end
