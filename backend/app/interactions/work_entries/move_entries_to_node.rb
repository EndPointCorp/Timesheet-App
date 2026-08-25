class WorkEntries::MoveEntriesToNode < ActiveInteraction::Base
  object :from, class: WorkChart
  object :to,   class: WorkChart

  def execute
    WorkEntry.where(work_chart_id: from.id).update_all(work_chart_id: to.id)
  end
end
