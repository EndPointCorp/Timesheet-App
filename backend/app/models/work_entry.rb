class WorkEntry < ActiveRecord::Base
  belongs_to :work_chart
  has_many :work_entry_durations
  has_many :work_entry_fees
  has_many :work_entry_audits
  has_many :approvals, dependent: :delete_all
  belongs_to :role, class_name: 'Role', foreign_key: :role_id


  before_save :sanitize_entry
  validates_presence_of :work_chart

  def fee=(new_fee)
    if self.work_entry_fees.first
      fee = self.work_entry_fees.first
      fee.fee = new_fee
      fee.save! if fee.id
    else
      self.work_entry_fees.build fee: new_fee,
        date_created: DateTime.now,
        last_modified: DateTime.now
    end
  end

  def owned_by?(user)
    self.role_id == user.role.id
  end

  def is_editable_by?(user)
    return self.approvals.count == 0 || self.approvals.where('? = any(owner_ids) and approved is null', user.role_id).count > 0 ||
      user.is_admin?
  end

  def owner
    @_owner ||= User.where(role_id: self.role_id).first
  end

  def to_report
    "#{self._chart_string}\n#{self._date_string}\n\n#{self._durations_string}\n\n#{self.description}"
  end

  def _chart_string
    self.work_chart_label_parts[1,99].join(" -> ")
  end

  def _date_string
    self.date_performed.strftime("%A, %Y-%m-%d") 
  end

  def _durations_string
    self.work_entry_durations.map do |d| 
      duration = Interval.new(d.duration.to_s).to_human_s
      "#{d.duration_kind.display_label} - #{duration}"
    end.join("\n")
  end

  def self.since(f)
    where("date_performed >= :date", date: f)
  end

  def self.to_day(day)
    where("date_performed < :day", day: day)
  end

  def self.for_user(user)
    WorkEntry.where(role_id: user.role_id)
  end

  # TODO: ponder what will happen to the current_deadline when the entry date_peformed will change
  def current_deadline
    now = self.date_performed
    if now.day >= 25
      at_next_month = now + 1.month
      DateTime.new(at_next_month.year, at_next_month.month, 1)
    else
      DateTime.new(now.year, now.month, 25)
    end
  end

  def main_deadline
    n = self.date_performed + 1.month
    DateTime.new(n.year, n.month, 5)
  end

  # used only in reports! - where the work entry has also additional columns
  # from join with work charts for performance
  def inlined_work_chart
    @inlined_work_chart ||= WorkChart.new(id: self.work_chart_id, parent_id: self.work_chart_parent_id,
                                          display_label: self.work_chart_display_label)
  end

  def work_chart_label_parts
    self.work_chart.labels
  end

  def total_fees
    return self.total_fee_sum if self.respond_to? :total_fee_sum
    self.work_entry_fees.inject(0) { |m, f| m += f.fee; m }
  end

  def total
    Interval.new self.total_duration
  end

  def total_duration
    return self.total_duration_sum if self.respond_to? :total_duration_sum
    self.total_for(self.work_entry_durations)
  end

  def total_pto
    self.total_for self.work_entry_durations.select { |d| !d.kind_code[/nonbillable_pto/].nil? }
  end

  def total_billable
    self.total_for self.work_entry_durations.select { |d| !d.kind_code[/^billable/].nil? }
  end

  def total_nonbillable
    self.total_for self.work_entry_durations.select { |d| !d.kind_code[/^nonbillable/].nil? && d.kind_code[/nonbillable_pto/].nil? }
  end

  def total_for(durations)
    durations.map(&:duration).map { |d| Interval.new(d) }.sum(Interval.new)
  end

  def sanitize_entry
    self.date_created = DateTime.now unless self.date_created
  end

  def to_custom_json
    self.to_json include: [:work_entry_durations, :work_entry_fees]
  end

  def self.vacation_entries
    WorkEntry.joins(:work_chart).where("work_chart.display_label like any(array[:array])", array: ["Vacation", "Personal"])
  end

  def self.holiday_entries
    WorkEntry.joins(:work_chart).where("work_chart.display_label = :label", label: "Holiday")
  end

  def self.sick_entries
    WorkEntry.joins(:work_chart).where("work_chart.display_label = :label", label: "Sick Time")
  end

  def self.by_user(user)
    WorkEntry.where(role_id: user.role_id)
  end

  def self.total_hours
    WorkEntry.joins(:work_entry_durations).
      select("EXTRACT(epoch from SUM(work_entry_durations.duration)/3600)::double precision as total_hours").
      group("work_entry_durations.id").
      map(&:total_hours).sum
  end

  def self.between_dates(start_date, end_date)
    WorkEntry.where("date_performed >= :date", date: start_date).
      where("date_performed <= :date", date: end_date)
  end
end
