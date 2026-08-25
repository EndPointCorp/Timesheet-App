# Helper model for accessing work days
class WorkDay

  attr_accessor :date, :user_id, :billable_time, :nonbillable_time, :has_zero, :pto_time,
    :has_entries, :has_redundant_entries

  def initialize(data = {})
    self.billable_time = Interval.new 0
    self.nonbillable_time = Interval.new 0
    self.pto_time = Interval.new 0
    data.each do |k, v|
      self.send "#{k}=", v
    end
  end

  def time
    @billable_time + @nonbillable_time + @pto_time
  end

  def self.by_year_and_month(user, year, month)
    first_day = DateTime.new(year.to_i, month.to_i, 1)
    start_range = first_day
    while start_range.wday > 0
      start_range = start_range - 1.day
    end
    last_day = DateTime.new(year.to_i, month.to_i, -1)
    end_range = last_day
    while end_range.wday < 6
      end_range = end_range + 1.day
    end
    days = {}
    db_days(user, start_range, end_range).to_a.each do |d|
      unless days[d["date_performed"]]
        days[d["date_performed"]] = WorkDay.new(has_zero: d["has_zero"], user_id: user.id,
                                                date: d["date_performed"].to_datetime,
                                                has_entries: d["has_entries"],
                                                has_redundant_entries: d["has_redundant_entries"])
      else
        days[d["date_performed"]].has_zero ||= d["has_zero"]
      end
      t = Interval.new d["time"]
      if d["kind_code"][/^billable/]
        bt = days[d["date_performed"]].billable_time || Interval.new(0)
        days[d["date_performed"]].billable_time = bt + t
      elsif d["kind_code"][/nonbillable_pto/]
        bt = days[d["date_performed"]].pto_time || Interval.new(0)
        days[d["date_performed"]].pto_time = bt + t
      else
        bt = days[d["date_performed"]].nonbillable_time || Interval.new(0)
        days[d["date_performed"]].nonbillable_time = bt + t
      end
    end
    days = days.values
    current = start_range# + 1.day
    while current <= last_day || current.wday > 0
      unless days.detect {|d| d.date.year == current.year && d.date.month == current.month && d.date.day == current.day}
        days << WorkDay.new( user_id: user.id, date: current, has_zero: false, has_entries: false, has_redundant_entries: false)
      end
      current = current + 1.day
    end
    days.sort_by(&:date)
  end

  def self.db_days(user, start_range, end_range)
    start_range = start_range.to_fs(:db) unless start_range.is_a?(String)
    end_range = end_range.to_fs(:db) unless end_range.is_a?(String)
    WorkEntry.connection.execute <<-sql
      SELECT not every(duration <> '00:00:00') as has_zero, SUM(duration) as time,
             date_performed, work_entry_durations.kind_code,
             count(work_chart_id) > 0 as has_entries,
             count(distinct(work_chart_id)) <> count(work_chart_id) as has_redundant_entries
      FROM work_entries
      INNER JOIN work_entry_durations
      ON work_entry_id = work_entries.id
      WHERE
      role_id = #{user.role_id}
      AND date_performed >= DATE '#{start_range}'
      AND date_performed <= DATE '#{end_range}'
      GROUP BY date_performed, work_entry_durations.kind_code ORDER BY date_performed;
    sql
  end

  def to_s
    "WorkDay(date: #{self.date}, time: #{time}, user_id: #{user_id})"
  end

end
