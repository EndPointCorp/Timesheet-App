class WorkCharts::EnsureNodeExists < ActiveInteraction::Base
  string :display_label
  object :parent, class: WorkChart

  def execute
    existing || newly_created
  end

  def existing
    @_exising ||= WorkChart.where(parent_id: parent.id,
                                  display_label: display_label).first
  end

  def newly_created
    @_newly_created ||=
      compose(WorkCharts::CreateWorkChart, parent: parent, display_label: display_label)
  end
end
