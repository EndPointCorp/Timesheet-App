class WorkCharts::AssignProjectManager < ActiveInteraction::Base
  object :work_chart
  object :user

  def execute
    right = manager_right

    right ||= Right.new date_created: DateTime.now, last_modified: DateTime.now, modified_by: user.role_id, 
      created_by: user.role_id, role_id: user.role_id, is_granted: true

    right.right_type = RightType.where(code: "project_manage").first
    right.targets << RightTarget.new(date_created: DateTime.now, created_by: user.role_id, 
                                         last_modified: DateTime.now, modified_by: user.role_id, 
                                         ref_obj_pk: work_chart.id.to_s)
    right.save!
  end

  def manager_right
    id = Right.joins(:right_type). 
      where(role_id: user.role_id).
      where(right_types: { code: 'project_manage'}).first.try(&:id)

    Right.find id if id
  end
end
