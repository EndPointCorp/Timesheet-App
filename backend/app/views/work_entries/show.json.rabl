object @work_entry
attributes :subject, :description, :date_performed, :work_chart_id
node :work_entry_durations do
  @work_entry.work_entry_durations.map do |d|
    {
      duration: Interval.new(d.duration),
      kind_code: d.kind_code,
      created_by: d.created_by,
      id: d.id
    }
  end
end
node :work_entry_fees do
  @work_entry.work_entry_fees.map { |f| {fee: f.fee} }
end
