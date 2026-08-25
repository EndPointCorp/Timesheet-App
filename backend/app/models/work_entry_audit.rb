class WorkEntryAudit < ActiveRecord::Base
  belongs_to :work_chart
  belongs_to :work_entry
  has_many :work_entry_durations
  has_many :work_entry_fees
  belongs_to :work_entry_status, foreign_key: :status_code, primary_key: :code
  belongs_to :role, class_name: 'Role', foreign_key: :role_id

  has_one :review, class_name: 'Review', dependent: :destroy

  # accepts_nested_attributes_for :work_entry_fees, :work_entry_durations,allow_destroy: true

  before_save :sanitize_entry
  validates_presence_of :work_chart

  def sanitize_entry
    self.date_created = DateTime.now unless self.date_created
  end
end
