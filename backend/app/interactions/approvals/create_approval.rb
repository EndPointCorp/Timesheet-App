class Approvals::CreateApproval < ActiveInteraction::Base
  object :work_entry
  array :users
  boolean :approved, default: nil
  string :comment, default: nil

  def execute
    Approval.create! work_entry: work_entry,
      owner_ids: users.map(&:role_id),
      approved: approved,
      comment: comment
  end
end
