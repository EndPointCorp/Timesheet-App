class WorkCharts::SetNodeKindSet < ActiveInteraction::Base
  object :work_chart
  object :default_kind, class: DurationKind, default: nil
  array :duration_kinds, default: [] do
    object class: DurationKind
  end

  def execute
    remove_current_set if has_set?
    remove_current_default if has_default?
    remove_current_kinds
    create_set
    create_kinds
    create_default if default_given?
  end

  def has_set?
    work_chart.work_chart_kind_sets.exists?
  end

  def kinds_given?
    not duration_kinds.empty?
  end

  def has_default?
    work_chart.work_chart_kinds_defaults.exists?
  end

  def default_given?
    not default_kind.nil?
  end

  def remove_current_set
    work_chart.work_chart_kind_sets.delete_all
  end

  def create_set
    WorkChartKindSet.create! work_chart_id: work_chart.id
  end

  def remove_current_default
    work_chart.work_chart_kinds_defaults.delete_all
  end

  def create_default
    WorkChartKindsDefault.create! work_chart_id: work_chart.id,
      kind_code: default_kind.code
  end

  def remove_current_kinds
    work_chart.work_chart_kinds.delete_all
  end

  def create_kinds
    ([ default_kind ] + duration_kinds).reject(&:nil?).map do |kind|
      WorkChartKind.create! work_chart_id: work_chart.id, kind_code: kind.code
    end
  end
end
