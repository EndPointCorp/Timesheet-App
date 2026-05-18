class WorkCharts::DeleteWorkChartKindsSet < ActiveInteraction::Base
  object :work_chart

  def execute
    WorkChartKindSet.find_by_work_chart_id(work_chart.id).try(:destroy)
    work_chart.work_chart_kinds.destroy
    work_chart.work_chart_kinds_defaults.destroy
    work_chart
  end
end
