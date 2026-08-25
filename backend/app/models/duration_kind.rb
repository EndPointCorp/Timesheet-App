class DurationKind < ActiveRecord::Base
  belongs_to :production_category
  has_many :work_entry_durations, foreign_key: :kind_code, primary_key: :code, dependent: :destroy


  def self.billable
    DurationKind.where("code ~ '^billable'")
  end

  def self.nonbillable
    DurationKind.where("code ~ '^nonbillable'")
  end
end
