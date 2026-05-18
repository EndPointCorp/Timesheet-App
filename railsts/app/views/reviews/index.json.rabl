collection @reviews
attributes :current_owner_id, :work_entry_id, :current_deadline, :id
node :author_name do |review|
  Role.find(review.work_entry.role_id).display_label.gsub(/User:\s/,'').camelize
end
node :author_email do |review|
  Role.find(review.work_entry.role_id).user.email
end
node :current_owner_email do |review|
  review.current_owner.role.user.email
end
node :date_performed do |review|
  review.work_entry.date_performed
end
node :work_chart_label_parts do |review|
  review.work_entry.work_chart_label_parts[1..1000]
end
node :durations do |review|
  review.work_entry.work_entry_durations.map do |duration| 
    {
      :type  => duration.duration_kind.display_label,
      :value => Interval.new(duration.duration)
    }
  end
end
node :description do |review| 
  review.work_entry.description
end
node :review_history do |review|
  review.messages.select { |m| m.author }.map do |message|
    {
      :date   => message.updated_at,
      :author => message.author.role.display_label.gsub(/User:\s/,'').camelize,
      :body   => message.body
    }
  end
end
node :next_reviewers do |review|
  review.next_reviewers.map do |u|
    {
      email: u.email,
      name: u.role.display_label.gsub(/User:\s/, '').camelize,
      id: u.id
    }
  end
end
node :back_reviewers do |review|
  review.back_reviewers.map do |u|
    {
      email: u.email,
      name: u.role.display_label.gsub(/User:\s/, '').camelize,
      id: u.id
    }
  end
end
node :next_reviewer do |review|
  rec = review.recipient_for(@effective_user)
  if rec
    {
      email: rec.email,
      name: rec.role.display_label.gsub(/User:\s/, '').camelize,
      id: rec.id
    }
  else
    nil
  end
end
