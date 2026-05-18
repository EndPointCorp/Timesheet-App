namespace :seed do
  task reviews: :environment do
    now = DateTime.now
    first_day = DateTime.new(now.year, now.month, 1)
    entries = WorkEntry.without_review.since(first_day)
    entries.each do |entry|
      Review.create_for(entry)
      puts "Created review for an entry: #{entry.role.display_label} for #{entry.work_chart_label_parts[1..1000].join(' - ')} from #{entry.date_performed}"
    end

    old_entries = WorkEntry.without_review.to_day(first_day)
    count = old_entries.count
    old_entries.each_with_index do |entry, i|
      r = Review.create_finished_for(entry)
      r.current_owner = r.recipient = nil
      r.save!
      puts "[#{i}/#{count}] Created review for an entry: #{entry.role.display_label} for #{entry.work_chart_label_parts[1..1000].join(' - ')} from #{entry.date_performed}"
    end
  end
end
