class WorkEntries::CreateWorkEntry < ActiveInteraction::Base
  integer :work_chart_id
  string :description
  float :fee
  object :user
  array :durations do
    hash do
      string :kind_code
      float :duration
    end
  end
  date :date_performed

  validates :description,
    presence: true
  validate :is_unique
  validate :is_work_chart_parent_dead
  validate :has_hours_left

  def execute
    assign_attributes
    activate_work_chart
    entry.save!
    compose(Approvals::CreateApproval, work_entry: entry, users: [ user ])
    entry
  end

  private

  def entry
    @_entry ||= WorkEntry.new date_created: DateTime.now, created_by: user.role_id,
      role_id: user.role_id,
      modified_by: user.role_id,
      last_modified: DateTime.now,
      date_performed: date_performed,
      description: description,
      work_chart_id: work_chart_id
  end

  def activate_work_chart
    WorkChart.where(id: work_chart_id).where.not(status: 'active').update_all(status: :active)
  end

  def assign_attributes
    assign_fee
    assign_durations
  end

  def assign_fee
    entry.fee = fee
  end

  def assign_durations
    durations.each do |duration|
     d = entry.work_entry_durations.build created_by: user.role_id,
       modified_by: user.role_id,
       date_created: DateTime.now,
       kind_code: duration[:kind_code],
       last_modified: DateTime.now
     d.duration = duration[:duration]
    end
  end

  def is_unique
    if WorkEntry.where(work_chart_id: work_chart_id).
                 where(role_id: user.role_id).
                 where(date_performed: date_performed).
                 where(description: description).count > 0
      errors.add(:work_entry, "already exists")
    end
  end

  def work_chart
    @work_chart ||= WorkChart.find work_chart_id
  end

  def is_work_chart_parent_dead
    parent_charts = work_chart.up_path_ids.to_a
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
        budget.nil? ||
          Interval.new(budget.hours_left).minutes >= billed
      }.call
    end
  end

  def has_hours_left
    if not durations_are_valid
      errors.add(:base, "There's not enough hours in the bank left")
    end
  end
end
