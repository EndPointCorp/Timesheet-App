class WorkEntries::DenyEntry < ActiveInteraction::Base
  object :work_entry
  object :user
  string :comment

  validate :approval_belongs_to_user
  validate :user_isnt_author

  def execute
    approval.update_attributes!(approved: false, comment: comment, role_id: user.role_id)
    compose(Approvals::CreateApproval, work_entry: work_entry, users: previous_reviewers)
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

  def previous_reviewers
    @_previous_reviewers ||= ReviewingFlow.previous(work_entry, user)
  end

  def approval
    @_approval ||= -> {
      work_entry.approvals.
      where(approved: nil).
      where('? = any(owner_ids)', user.role_id).
      first
    }.call
  end

  def user_isnt_author
    if !approval.nil? && approval.owner_ids.include?(work_entry.role_id)
      errors.add(:user, "cannot be an author to deny as author is the first one to approve")
    end
  end

  def approval_belongs_to_user
    if approval.nil?
      errors.add(:user, "has to be an owner of the current approval decision")
    end
  end
end
