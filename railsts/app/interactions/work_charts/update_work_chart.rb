class WorkCharts::UpdateWorkChart < ActiveInteraction::Base
  object :work_chart
  integer :parent_id, default: nil
  string :display_label, default: nil
  object :user, default: nil
  boolean :dont_send_empty_reports, default: nil
  string :status, default: nil

  validate :changing_parent_doesnt_happen_for_budgets

  def execute
    work_chart.update! display_label: display_label,
      parent_id: parent_id || work_chart.parent_id,
      dont_send_empty_reports: dont_send_empty_reports || work_chart.dont_send_empty_reports,
      status: status || work_chart.status,
      last_modified: DateTime.now,
      modified_by: user.try(:email) || nil
  end

  def changing_parent_doesnt_happen_for_budgets
    if work_chart.parent_id != parent_id && was_budgeted?
      errors.add(:base, 'Cannot change the parent for a chart that ever belong to a budget')
    end
  end

  def was_budgeted?
    ChartLabel.find(work_chart.id).
      transactions_in_path.present?
  end
end
