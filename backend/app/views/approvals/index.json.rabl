collection @approvals
attributes :id, :work_chart_id, :date_performed, :description, :owner
node :durations do |e|
  e.work_entry_durations.map do |d|
    {
      kind_code: d.kind_code,
      duration: Interval.new(d.duration).minutes
    }
  end
end
node :total_fees do |e|
  e.total_fees.to_f
end
node :comments do |e|
  e.approvals.where.not('? = any(owner_ids)', @effective_user.role_id).where(approved: false).order('created_at desc').map do |a|
    {
      username: a.reviewer.user.username,
      created_at: a.created_at.strftime('%A, %Y-%m-%d'),
      body: a.comment
    }
  end
end
node :kind_code_display do |e|
  e.work_entry_durations.map(&:kind_code).map(&:titleize).join.gsub(' ', ': ')
end
