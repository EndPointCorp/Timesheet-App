class Approvals::UpdateApproval < ActiveInteraction::Base
  object :work_entry
  object :user
  boolean :approved
  string :comment, default: nil

  def execute
    if approved
      compose(WorkEntries::ApproveEntry, work_entry: work_entry, user: user)
    else
      compose(WorkEntries::DenyEntry, work_entry: work_entry, user: user, comment: comment)
    end
  end
end
