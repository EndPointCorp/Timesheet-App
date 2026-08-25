class Transactions::CreateTransaction < ActiveInteraction::Base
  integer :work_chart_id, :user_id
  float :hours
  string :description
  string :kind_code, default: 'billable'
  string :mode
  date :date
  date :date_closed, default: nil
  hash :recur_at, default: nil do
    integer :minutes, default: 0
    integer :hours, default: nil
    integer :day_of_month, default: nil
    integer :month, default: nil
    integer :day_of_week, default: nil
    integer :year, default: nil
  end

  validates :work_chart_id, presence: true, numericality: { greater_than: 0 }
  validates :date, presence: true
  validates :user_id, presence: true, numericality: { greater_than: 0 }
  validates :hours, presence: true, numericality: { greater_than: 0 }
  validate :recur_valid

  def execute
    res = Transaction.create! work_chart_id: work_chart_id,
      date: date,
      date_closed: date_closed,
      user_id: user_id,
      hours: hours,
      description: description,
      kind_code: kind_code,
      mode: mode,
      recur_at: recur_at.nil? ? nil : CronSpec.new(recur_at)
    compose(Transactions::ScheduleRecurTransaction, transaction: res)
    res
  end

  def recur_valid
    if !recur_at.nil? && (recur_at[:minutes].nil? || recur_at[:hours].nil? )
      errors.add(:base, "Please specify both minute and hour not to repeat transactions mutiple times per day")
    end
  end

end
