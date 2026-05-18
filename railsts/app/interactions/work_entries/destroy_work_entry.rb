class WorkEntries::DestroyWorkEntry < ActiveInteraction::Base
  integer :work_entry_id
  object :user
  validate :is_editable_for_user

  def execute
    entry.destroy
  end

  private

  def entry
    @_entry ||= WorkEntry.find(work_entry_id)
  end

  def is_editable_for_user
    unless entry.is_editable_by?(user)
      errors.add(:work_entry, "cannot be edited by current user")
    end
  end
end
