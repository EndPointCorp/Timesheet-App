class WorkEntries::UpdateWorkEntry < ActiveInteraction::Base
  integer :id, :work_chart_id
  string :description
  float :fee
  object :user
  array :durations do
    hash do
      string :kind_code
      float :duration
      integer :id, default: nil
    end
  end
  date :date_performed

  validates :description,
    presence: true
  validate :doesnt_cross_available_hours
  validate :is_editable
  validate :is_work_chart_parent_dead
  validate :has_hours_left

  def execute
    before_text = entry.to_report
    assign_attributes
    entry.save!
    send_entry_changed_email(before_text) unless entry.owned_by?(user)
    activate_work_chart
    entry
  end

  private

  def entry
    @_entry ||= WorkEntry.find id
  end

  def send_entry_changed_email(before_text)
    WorkEntriesMailer.notify_entry_changed(entry, before_text, user).deliver_now
  end

  def activate_work_chart
    WorkChart.where(id: work_chart_id).where(status: 'active').update_all(status: :active)
  end

  def assign_attributes
    entry.description = description
    entry.work_chart_id = work_chart_id
    entry.date_performed = date_performed
    entry.modified_by = user.role_id
    assign_fee
    assign_durations
  end

  def assign_fee
    entry.fee = fee
  end

  def assign_durations
    durations.each do |duration|
      existing = entry.work_entry_durations.where(kind_code: duration[:kind_code])
      if existing.present?
        existing.update_all(duration: Interval.new(duration[:duration].to_i).to_interval_string, last_modified: DateTime.now)
      else
        d = entry.work_entry_durations.build created_by: user.role_id,
          modified_by: user.role_id,
          date_created: DateTime.now,
          kind_code: duration[:kind_code],
          last_modified: DateTime.now
        d.duration = duration[:duration]
      end
    end
    kinds = durations.map { |d| d[:kind_code] }
    entry.work_entry_durations.select {|d| not kinds.include?(d.kind_code)}.each(&:delete)
  end

  def doesnt_cross_available_hours
  end

  def is_editable
    unless entry.is_editable_by?(user)
      errors.add(:work_entry, "isn't editable by current user")
    end
  end

  def is_work_chart_parent_dead
    @work_chart = WorkChart.find work_chart_id
    parent_charts = @work_chart.up_path_ids.to_a
    if WorkChart.where(id: (parent_charts), status: 'dead').size > 0
      errors.add(:work_entry, "one of the parent work chart dead")
    end
  end

  def modes
    [ 'billable', 'nonbillable' ].inject({}) do |obj, mode|
      duration = durations.find do |dur|
        !dur[:kind_code].match(/^#{mode}/).nil?
      end
      obj[mode] ||= []
      obj[mode] << duration if not duration.nil?
      obj
    end
  end

  def durations_are_valid
    modes.all? do |mode, durations|
      durations.count == 0 || -> {
        budget_id = HoursInTheBank::Day.joins("inner join chart_labels on budget_days.budget_id = any(chart_labels.ids)").
          where(date: date_performed, kind_code: mode).where("chart_labels.id = ?", work_chart_id).first.try(:budget_id)
        budget = HoursInTheBank::Budget.where(work_chart_id: budget_id, kind_code: mode).first if budget_id
        billed = durations.map { |d| d[:duration] }.sum
        billed_before = entry.work_entry_durations.select { |d| !d.kind_code[/^#{mode}/].nil? }.
          map { |d| Interval.new(d.duration).minutes }.sum
        budget.nil? ||
          Interval.new(budget.hours_left).minutes >= billed - billed_before
      }.call
    end
  end

  def has_hours_left
    if not durations_are_valid
      errors.add(:base, "There's not enough hours in the bank left")
    end
  end
end
