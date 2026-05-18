class ProductionCategory < ActiveRecord::Base
  has_many :duration_kinds, dependent: :destroy
  has_many :work_entry_durations, dependent: :destroy
end
