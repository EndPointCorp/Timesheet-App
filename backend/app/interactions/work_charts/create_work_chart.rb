class WorkCharts::CreateWorkChart < ActiveInteraction::Base
  object :parent, class: WorkChart
  string :display_label
  object :user, default: nil

  validate :parent_doesnt_have_entries

  def execute
    chart = WorkChart.new display_label: display_label, status: 'active', parent_id: parent.id
    chart.created_by = chart.modified_by = (user.try(:role_id) || nil)
    chart.date_created = DateTime.now
    chart.save!
    chart
  end

  def parent_doesnt_have_entries
    if WorkEntry.where(work_chart_id: parent.id).count > 0
      errors.add(:parent, "cannot have any work entries associated")
    end
  end
end
