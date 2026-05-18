namespace :messages do
  desc "Notify any deadlines within 3 days"
  task notify_deadlines: :environment do
    Rails.application.eager_load!
    count = Review.deadline_in_3_days.count
    Review.deadline_in_3_days.each_with_index do |review, iter|
      review.create_deadline_in_3_days_messages
      puts "[#{iter}/#{count}] Created deadline in 3 days messages for a review ##{review.id}"
    end
  end
end
