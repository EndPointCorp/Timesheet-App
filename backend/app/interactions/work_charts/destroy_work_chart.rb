class WorkCharts::DestroyWorkChart < ActiveInteraction::Base
  object :work_chart

  validate :no_entries_under_chart
  validate :is_a_leaf
  validate :isnt_assigned_to_reporting_right

  def execute
    work_chart.destroy
  end

  def no_entries_under_chart
    if work_chart.work_entries.present?
      errors.add(:base, "Can't delete this chart because there are entries entered against it")
    end
  end

  def is_a_leaf
    if work_chart.children.present?
      errors.add(:base, "Can't delete this chart because it has children")
    end
  end

  def isnt_assigned_to_reporting_right
    if RightTarget.joins(right: :right_type).
        where(right_types: { target_kind_code: "work_chart" }, ref_obj_pk: work_chart.id).count > 0
      errors.add(:base, "Can't delete this chart because it is a target of some user's right")
    end
  end
end
