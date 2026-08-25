class WorkCharts::CreateMissingRelationshipNode < ActiveInteraction::Base
  object :work_chart
  object :parent, class: WorkChart

  def execute
    Rails.logger.info "Ensuring relationship node exists: #{work_chart.display_label}"
    compose(WorkCharts::EnsureNodeExists, parent: parent, display_label: work_chart.display_label)
  end
end
