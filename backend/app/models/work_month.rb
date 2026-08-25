class WorkMonth
  attr_accessor :year, :month, :user_id, :billable_total, :nonbillable_total, :pto_total, :available, :total, :difference

  # naive implementation - subject to refactor and performance tuning later
  def self.find_by_range(user, start, _end)
    current = _end
    months = []
    today = Time.now.in_time_zone(user.time_zone_code).to_date rescue Date.today
    while current >= start
      days = WorkDay.by_year_and_month(user, current.year, current.month)
                    .select {|d| d.date.month == current.month}

      m = WorkMonth.new
      m.user_id = user.id
      if current.year == Date.today.year && current.month == Date.today.month
        first = Date.new(today.year, today.month, 1)
        available = (first..today).reject {|d| [0, 6].include?(d.wday) }.count * 8 * 60
        m.available = Interval.new available
      else
        if current < Date.today
          available = (current.beginning_of_month..current.end_of_month).
            reject {|d| [0, 6].include?(d.wday) }.count * 8 * 60
          m.available = Interval.new available
        else
          m.available = Interval.new 0
        end
      end
      m.billable_total = Interval.new days.map(&:billable_time).sum(Interval.new)
      m.nonbillable_total = Interval.new days.map(&:nonbillable_time).sum(Interval.new)
      m.pto_total = Interval.new days.map(&:pto_time).sum(Interval.new)
      m.total = m.billable_total + m.nonbillable_total + m.pto_total
      m.total = Interval.new m.total
      m.difference = m.total - m.available
      m.year = current.year
      m.month = current.month
      months << m
      current = current - 1.month
    end
    months
  end
end
