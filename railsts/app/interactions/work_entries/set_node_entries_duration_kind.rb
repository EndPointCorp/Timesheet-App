class WorkEntries::SetNodeEntriesDurationKind < ActiveInteraction::Base
  object :work_chart
  object :duration_kind

  def execute
    durations.update_all(kind_code: duration_kind.code)
  end

  def durations
    WorkEntryDuration.joins(:work_entry).
      where(work_entry: { work_chart_id:  work_chart.id})
  end
end
