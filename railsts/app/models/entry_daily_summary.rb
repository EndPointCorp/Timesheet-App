class EntryDailySummary < ActiveRecord::Base
  belongs_to :work_entry, foreign_key: :id
  belongs_to :approval, foreign_key: :id, primary_key: :work_entry_id

  def self.with_last_approving_role_id
    joins(:approval).
      select("entry_daily_summaries.*, nth_value(approvals.role_id, 2) over (order by approvals.updated_at desc) as last_approving_role_id")
  end

end
