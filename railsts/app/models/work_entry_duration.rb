class WorkEntryDuration < ActiveRecord::Base
  belongs_to :work_entry
  belongs_to :duration_kind, foreign_key: :kind_code, primary_key: :code
  belongs_to :production_category


  after_initialize :sanitize_duration

  def duration=(duration)
    d = Interval.new duration.to_i
    self[:duration] = "#{d.clock_hours}:#{d.clock_minutes}:00"
  end

  def label
    kind_code.titleize.gsub(' ', ': ')
  end

  private
  def sanitize_duration
    return unless self.attributes.has_key? :date_created
    self.date_created = DateTime.now unless self.date_created
    self.duration = "00:00:00" unless self.duration
  end
  
end
