class Transactions::RecurTransaction < ActiveInteraction::Base
  object :transaction

  validate :transaction_is_recurring

  def execute
    next_recur_at = transaction.recur_at.as_json
    next_date_closed = next_recur_dates[0] if transaction.date_closed.nil?

    transaction.recur_at = nil
    transaction.date_closed = transaction.mode == 'zero-out' ? DateTime.now : nil
    transaction.save!

    compose(Transactions::CreateTransaction,
            user_id: transaction.user_id,
            work_chart_id: transaction.work_chart_id,
            hours: transaction.hours,
            description: "Recurred: #{transaction.description.gsub(/^Recurred: /, '')}",
            kind_code: transaction.kind_code,
            mode: transaction.mode,
            date: next_date,
            date_closed: next_date_closed,
            recur_at: next_recur_at)
  end

  def next_date
    DateTime.now
  end

  def next_recur_dates
    # it's a lazy enum so let's store the new copy here
    @_recur_dates ||= transaction.recur_dates.
      select{ |d| DateTime.now < d }.
      take(3).to_a
  end

  def transaction_is_recurring
    if transaction.recur_at.nil?
      errors.add(:transaction, "must be recurring")
    end
  end
end
