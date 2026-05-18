class HoursInTheBank::HistoryBudgetEntry < ActiveRecord::Base
  self.table_name = :all_budget_entries

  def self.with_users
    joins("inner join users on users.role_id = all_budget_entries.role_id")
  end

  def self.with_work_entry_durations
    joins("inner join work_entry_durations on work_entry_durations.work_entry_id = all_budget_entries.id")
  end

  def self.with_duration_kinds
    joins("inner join duration_kinds on duration_kinds.code = work_entry_durations.kind_code")
  end
end



