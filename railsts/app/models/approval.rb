class Approval < ActiveRecord::Base
  belongs_to :work_entry

  def reviewers
    User.where(role_id: self.owner_ids)
  end
end
