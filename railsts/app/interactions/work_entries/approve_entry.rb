class WorkEntries::ApproveEntry < ActiveInteraction::Base
  object :work_entry
  object :user

  validate :approval_belongs_to_user

  def execute
    approval.update!(approved: true, role_id: user.role_id)
    if !next_reviewers.empty?
      compose(Approvals::CreateApproval, work_entry: work_entry, users: next_reviewers)
    end
    approval
  end

  def has_project_managers?
    !project_managers.empty?
  end

  def project_managers
    @_project_managers ||= -> {
      work_entry.work_chart.project_managers
    }.call
  end

  def next_reviewers
    @_next_reviewers ||= ReviewingFlow.next(work_entry, user)
  end

  def approval
    @_approval ||= -> {
      work_entry.approvals.
      where(approved: nil).
      where("? = any(owner_ids)", user.role_id).
      first
    }.call
  end

  def approval_belongs_to_user
    if approval.nil?
      errors.add(:user, "has to be an owner of the current approval decision")
    end
  end
end
