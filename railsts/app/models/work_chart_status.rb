class WorkChartStatus < ActiveRecord::Base
  before_create :record_time
  has_many :work_charts, foreign_key: :status, primary_key: :status, dependent: :destroy

  private
    def record_time
      self.date_created = DateTime.now
      self.last_modified = DateTime.now
    end
end
