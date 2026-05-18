class ProjectedTransaction < ActiveRecord::Base
  # Database View!

  self.primary_key = :id

  def self.recurring_to_add
    where("next_date > :date", date: DateTime.now)
  end
end
