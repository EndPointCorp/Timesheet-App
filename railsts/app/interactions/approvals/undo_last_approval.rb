class Approvals::UndoLastApproval < ActiveInteraction::Base
  object :user
  integer :id, default: nil

  validate :had_any_approvals
  validate :next_approval_not_resolved

  def execute
    approval.update_attributes(approved: nil)
    next_approvals.delete_all
  end

  def approval
    @_approval ||= -> {
      scope = id.nil? ? Approval.where({}) : Approval.where(work_entry_id: id)
      scope.where('? = any(owner_ids) and approved is not null', user.role_id).
        order('updated_at desc').first
    }.call
  end

  def next_approvals
    return [] if approval.nil?
    @_next_approvals ||= Approval.where(work_entry_id: approval.work_entry_id).
      where.not(id: approval.id).
      where('created_at > ?', approval.created_at).
      order(:created_at)
  end

  def had_any_approvals
    if approval.nil?
      errors.add(:user, "has to have anything to undo")
    end
  end

  def next_approval_not_resolved
    if next_approvals.count > 0 && !next_approvals.first.approved.nil?
      errors.add(:base, "cannot undo approval or deny as the other user already took action afterwards")
    end
  end
end
