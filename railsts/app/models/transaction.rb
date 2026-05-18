class Transaction < ActiveRecord::Base
  belongs_to :work_chart, foreign_key: 'work_chart_id'
  belongs_to :author, class_name: "User", foreign_key: 'user_id'

  MODES = [ 'cumulative', 'zero-out' ]
  validates :mode, presence: true, inclusion: MODES

  serialize :recur_at, CronSpec

  def self.by_work_chart(work_chart)
    where(work_chart_id: work_chart.id)
  end

  def recurs?
    not recur_at.nil? and not recur_at.empty?
  end

  def recur_dates
    recurs? ? recur_at.dates_since(DateTime.new(self.date.year, self.date.month, self.date.day)) : [].lazy
  end
end
