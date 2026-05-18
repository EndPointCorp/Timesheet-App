class RecurTransactionJob < ActiveJob::Base
  queue_as :default

  def perform(transaction_id, updated_at)
    transaction = Transaction.where(id: transaction_id).first
    return if transaction.nil? or transaction.updated_at.to_i != updated_at

    Transactions::RecurTransaction.run! transaction: transaction
  end
end
