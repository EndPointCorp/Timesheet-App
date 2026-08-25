class WorkCharts::ClearProjectManagers < ActiveInteraction::Base
  object :work_chart

  def execute
    right_ids_query = Right.joins([:right_type, :targets]).
      where(right_types: { code: 'project_manage' }).
      where(right_targets: { ref_obj_pk: work_chart.id.to_s})

    RightTarget.
      where("right_id in (:ids)", ids: right_ids_query.select(:id)).
      delete_all
  end
end
