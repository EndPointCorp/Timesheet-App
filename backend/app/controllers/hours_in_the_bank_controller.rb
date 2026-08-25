class HoursInTheBankController < ApplicationController
  before_action :ensure_logged_in
  before_action :fetch_project_ids, only: [ :summary, :active_projects ]

  def show
    id = params[:work_chart_id]
    if id.nil? || effective_user.nil?
      render status: 400
    else
      ids = ChartLabel.where(id: params[:work_chart_id]).pluck(:ids).flatten
      @budgets = HoursInTheBank::Budget.
        where(work_chart_id: ids).
        group_by(&:kind_code).
        values.
        map { |arr| arr.max_by { |a| a.labels.count } }
    end
  end

  def entries
    return render(status: 401, json: {}) if effective_user.nil?

    @entries = HoursInTheBank::HistoryBudgetEntry.with_users.
      with_work_entry_durations.
      with_duration_kinds.
      where(budget_id: params[:budget_id]).
      select([:budget_id, :id, :date, :kind_code]).
      select("users.name, duration_kinds.display_label as duration_kind, work_entry_durations.duration").
      order("date desc").
      limit(10)
  end

  def active_projects
    return render(status: 401, json: {}) if effective_user.nil?

    @budgets = if effective_user.is_director?
      HoursInTheBank::HistoryBudget.where({})
    else
      role_ids = if effective_user.is_manager?
        Team.by_manager(effective_user).map(&:members).
	     flatten.uniq.map(&:id) + [effective_user.role_id]
      else
        [ effective_user.role_id ]
      end

      HoursInTheBank::HistoryBudget.where("array[?]::int[] && role_ids", role_ids)
    end

    if @project_ids.present?
      @budgets = @budgets.union HoursInTheBank::HistoryBudget.where(work_chart_id: @project_ids)
    end

    @budgets = @budgets.group_by(&:work_chart_id).map do |budget|
      OpenStruct.new({ work_chart_id: budget.first, budgets: budget.last })
    end
  end

  def summary
    return render(status: 401, json: {}) if effective_user.nil?

    scope = HoursInTheBank::Budget.joins(:work_chart).where(work_chart: { status: 'active' })

    @budgets = if effective_user.is_director?
      scope.where("hours_left <= interval '16 hours'")
    else
      role_ids = if effective_user.is_manager?
        Team.by_manager(effective_user).map(&:members).
	     flatten.uniq.map(&:id) + [effective_user.role_id]
      else
        [ effective_user.role_id ]
      end

      scope.where("array[?]::int[] && role_ids", role_ids)
    end

    if @project_ids.present?
      @budgets = @budgets.union scope.where(work_chart_id: @project_ids)
    end
  end

  private

  def needed_for_user(info)
    !effective_user.is_director? or info.minutes_left <= (16 * 60)
  end

  def fetch_project_ids
    return if effective_user.nil?

    @project_ids = RightTarget.joins(right: [:right_type]).
      where(right_types: { code: 'project_manage' }, rights: { role_id: effective_user.role_id }).
      select(:ref_obj_pk).
      map(&:ref_obj_pk).
      map(&:to_i)
  end
end
