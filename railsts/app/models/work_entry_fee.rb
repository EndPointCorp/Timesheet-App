class WorkEntryFee < ActiveRecord::Base
  belongs_to :work_entry

  before_save :sanitize_fee

  private
  def sanitize_fee
    self.date_created = DateTime.now unless self.date_created
  end
end
