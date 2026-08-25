collection @entries
attributes :description, :work_chart_label_parts, :id, :work_chart_id, 
  :is_invoiced, :approved_count
node :kind_code do |e|
  e.kinds.join(', ')
end
node :fee_total do |e|
  e.fee_total.to_f
end
node :total_duration do |e|
  Interval.new(e.total_billable) +
    Interval.new(e.total_nonbillable) +
    Interval.new(e.total_pto)
end
node :total_billable do |e|
  Interval.new e.total_billable
end
node :total_nonbillable do |e|
  Interval.new e.total_nonbillable
end
node :total_pto do |e|
  Interval.new e.total_pto
end
node :is_reclaimable do |e|
  e.owners.select { |o| o["email"] == @effective_user.email }.count == 0 &&
  e.approved_roles.
    sort_by { |role| DateTime.parse(role["updated_at"]) }.
    reverse.
    first.
    try(:fetch, "role_id") == @effective_user.role_id
end
node :owners do |e|
  if e.owners.empty? && e.approved_roles.count == 0
    nil
  else
    e.owners
  end
end
