class WorkCharts::UpdateWorkChartKinds < ActiveInteraction::Base
  object :work_chart
  array :work_chart_kinds do
    string
  end
  string :work_chart_kinds_defaults

  def execute
    clear
    if work_chart_kinds.present?
      work_chart.work_chart_kind_sets.create()
      work_chart_kinds.each do |kind|
        work_chart.work_chart_kinds.create!(kind_code: kind)
      end
    end
    if work_chart_kinds_defaults.present?
      work_chart.work_chart_kinds_defaults.create!(kind_code: work_chart_kinds_defaults)
    end
  end

  def clear
    WorkChartKindSet.find_by_work_chart_id(work_chart.id).try(:destroy)
    work_chart.work_chart_kinds.destroy
    work_chart.work_chart_kinds_defaults.destroy
  end
end
