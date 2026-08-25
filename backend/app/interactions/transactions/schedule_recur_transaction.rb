class Transactions::ScheduleRecurTransaction < ActiveInteraction::Base
  object :transaction

  def execute
    return if not transaction.recurs?

    RecurTransactionJob.set(wait_until: next_date).
      perform_later(transaction.id, transaction.updated_at.to_i)
  end

  def next_date
    transaction.recur_dates.select do |date|
      date > 1.minute.since
    end.first
  end
end
