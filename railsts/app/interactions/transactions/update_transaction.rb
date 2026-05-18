class Transactions::UpdateTransaction < ActiveInteraction::Base
  integer :id
  float :hours
  string :description
  date :date
  date :date_closed, default: nil
  string :mode, default: 'billable'
  string :recur_mode, default: 'cumulative'
  hash :recur_at, default: nil do
    integer :minutes, default: nil
    integer :hours, default: nil
    integer :day_of_month, default: nil
    integer :month, default: nil
    integer :day_of_week, default: nil
    integer :year, default: nil
  end

  validates :hours, presence: true, numericality: { other_than: 0 }
  validates :id, presence: true, numericality: { greater_than: 0 }
  validate :recur_valid

  def execute
    @transaction = Transaction.find id
    @transaction.hours = hours
    @transaction.date = date
    @transaction.date_closed = date_closed
    @transaction.description = description
    @transaction.recur_at = recur_at.nil? ? nil : CronSpec.new(recur_at)
    @transaction.kind_code = mode
    @transaction.mode = recur_mode
    @transaction.save!
    compose(Transactions::ScheduleRecurTransaction, transaction: @transaction)
    @transaction
  end

  def recur_valid
    if !recur_at.nil? && (recur_at[:minutes].nil? || recur_at[:hours].nil? )
      errors.add(:base, "Please specify both minute and hour not to repeat transactions mutiple times per day")
    end
  end

end
