class Approvals::BatchUpdateApprovals < ActiveInteraction::Base
  date :date_older_than
  object :user
  boolean :approved

  def execute
    WorkEntry.transaction do
      work_entries.each do |work_entry|
        update(work_entry)
      end
    end
  end

  def work_entries
    WorkEntry.where(
      id: ApprovalsSummary.where('? = any(approval_owner_ids)', user.role_id).select(:id)
    ).where("date_performed < ?", date_older_than)
  end

  def update(work_entry)
    if approved
      compose(WorkEntries::ApproveEntry, work_entry: work_entry, user: user)
    else
      compose(WorkEntries::DenyEntry, work_entry: work_entry, user: user, comment: comment)
    end
  end

  def comment
    "Batch approved"
  end
end

