class WorkCharts::AssignPMs < ActiveInteraction::Base
  object :work_chart
  array :users

  def execute
    clear_old_assign_new_pm
  end

  private

  def clear_old_assign_new_pm
    compose(WorkCharts::ClearProjectManagers, work_chart: work_chart)

    users.each do |user|
      compose(WorkCharts::AssignProjectManager, work_chart: work_chart,
              user: user)
    end
  end
end
