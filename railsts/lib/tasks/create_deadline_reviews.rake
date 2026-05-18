
namespace :messages do
  desc "For all reviews with passed deadlines creates messages for owners, client reps and team managers"
  task harvest_deadlines: :environment do
    Rails.application.eager_load!
    count = Review.with_passed_deadline.count
    Review.with_passed_deadline.each_with_index do |review, iter|
      review.create_deadline_messages
      puts "[#{iter}/#{count}] Created deadline messages for a review ##{review.id}"
    end
  end
end
