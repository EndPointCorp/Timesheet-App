class Transactions::DeleteTransaction < ActiveInteraction::Base
  integer :id
  object :user

  validate :transaction_must_exist
  validate :user_is_director_or_superuser

  def execute
    transaction.destroy
  end

  def transaction
    @_transaction ||= Transaction.where(id: id).first
  end

  def user_is_director_or_superuser
    if !(user.is_admin? || user.is_director?)
      errors.add(:user, "must be a director or a superuser to delete transaction")
    end
  end

  def transaction_must_exist
    if transaction.nil?
      errors.add(:id, "doesn't point at existant transaction")
    end
  end
end
