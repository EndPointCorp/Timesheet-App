class Reports::CreateReportsPreset < ActiveInteraction::Base
  integer :user_id
  string :name
  string :report_type
  date :start_date
  date :end_date
  integer :work_chart_id
  array :roles
  boolean :description
  boolean :show_all_roles
  string :fragmentation
  boolean :dates_relative
  string :dates_period_type
  
  validates :user_id, presence: true, numericality: { greater_than: 0 }
  validates :name, presence: true

  validate :ensure_name_uniqueness

  def execute
    res = ReportsPreset.create! inputs

    res
  end

  def ensure_name_uniqueness
    unless ReportsPreset.where(name: name, user_id: user_id).first.nil?
      errors.add(:name, 'must be unique')
    end
  end
end
